alter table public.chat_messages add column read_at timestamptz;

create function private.mark_messages_read(thread uuid, message_ids bigint[])
returns void language sql security definer set search_path = '' as $$
  update public.chat_messages m set read_at = now()
  from public.listing_chats c
  where c.id = thread and m.chat_id = c.id and m.id = any(message_ids)
    and auth.uid() in (c.buyer_id, c.seller_id)
    and m.sender_id <> auth.uid() and m.read_at is null;
$$;
create function public.mark_messages_read(thread uuid, message_ids bigint[])
returns void language sql security invoker set search_path = '' as $$
  select private.mark_messages_read(thread, message_ids);
$$;
create function public.message_notifications()
returns table(chat_id uuid, unread_count bigint, latest_id bigint)
language sql stable security invoker set search_path = '' as $$
  select m.chat_id, count(*) filter (where m.read_at is null), max(m.id)
  from public.chat_messages m where m.sender_id <> auth.uid() group by m.chat_id;
$$;
revoke all on function private.mark_messages_read(uuid,bigint[]), public.mark_messages_read(uuid,bigint[]), public.message_notifications() from public,anon,authenticated;
grant execute on function private.mark_messages_read(uuid,bigint[]), public.mark_messages_read(uuid,bigint[]), public.message_notifications() to authenticated;
notify pgrst,'reload schema';
