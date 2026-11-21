create table public.listing_chats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  updated_at timestamptz not null default now(),
  unique (listing_id,buyer_id),
  check (buyer_id <> seller_id)
);
create index listing_chats_buyer on public.listing_chats(buyer_id,updated_at desc);
create index listing_chats_seller on public.listing_chats(seller_id,updated_at desc);
create table public.chat_messages (
  id bigint generated always as identity primary key,
  chat_id uuid not null references public.listing_chats(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index chat_message_history on public.chat_messages(chat_id,id);
alter table public.listing_chats enable row level security;
alter table public.chat_messages enable row level security;
revoke all on public.listing_chats,public.chat_messages from public,anon,authenticated;
grant select on public.listing_chats,public.chat_messages to authenticated;
create policy chat_participants on public.listing_chats for select to authenticated
using ((select auth.uid()) in (buyer_id,seller_id));
create policy message_participants on public.chat_messages for select to authenticated
using (exists(select 1 from public.listing_chats c where c.id=chat_id));

create function private.send_listing_message(item uuid, thread uuid, message text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); ad public.listings; conversation uuid;
begin
  if actor is null or num_nonnulls(item,thread) <> 1 or message is null
     or length(trim(message)) not between 1 and 2000 then raise exception 'Geçersiz mesaj.'; end if;
  if thread is null then
    select * into ad from public.listings where id=item and status='published' for share;
    if not found or actor=ad.seller_id then raise exception 'Bu ilana mesaj gönderilemez.'; end if;
    insert into public.listing_chats(listing_id,buyer_id,seller_id,title)
      values(item,actor,ad.seller_id,ad.title)
      on conflict(listing_id,buyer_id) do update set title=excluded.title returning id into conversation;
  else
    select id into conversation from public.listing_chats where id=thread and actor in (buyer_id,seller_id) for update;
    if not found then raise exception 'Sohbet bulunamadı.'; end if;
  end if;
  insert into public.chat_messages(chat_id,sender_id,body) values(conversation,actor,trim(message));
  update public.listing_chats set updated_at=clock_timestamp() where id=conversation;
  return conversation;
end $$;
create function public.send_listing_message(item uuid,thread uuid,message text)
returns uuid language sql security invoker set search_path='' as $$ select private.send_listing_message(item,thread,message) $$;
revoke all on function public.send_listing_message(uuid,uuid,text),private.send_listing_message(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.send_listing_message(uuid,uuid,text),private.send_listing_message(uuid,uuid,text) to authenticated;
notify pgrst,'reload schema';
