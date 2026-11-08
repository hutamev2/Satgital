create table public.market_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings on delete set null,
  buyer_id uuid not null references auth.users on delete restrict,
  seller_id uuid not null references auth.users on delete restrict,
  title text not null,
  cover_path text,
  amount numeric(12,2) not null check (amount > 0),
  status text not null check (status in ('pending','accepted','completed','cancelled','rejected')),
  created_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create unique index market_one_sale on public.market_orders(listing_id)
  where status in ('pending','accepted','completed');
create index market_buyer on public.market_orders(buyer_id,created_at desc);
create index market_seller on public.market_orders(seller_id,created_at desc);
alter table public.market_orders enable row level security;
revoke all on public.market_orders from public, anon, authenticated;
grant select on public.market_orders to authenticated;
create policy parties_read on public.market_orders for select to authenticated
  using ((select auth.uid()) in (buyer_id,seller_id));

create table public.favorites (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  listing_id uuid not null references public.listings on delete cascade,
  title text not null,
  price numeric(12,2) not null,
  status text not null,
  created_at timestamptz not null default now(),
  primary key(user_id,listing_id)
);
create index favorites_listing on public.favorites(listing_id);
alter table public.favorites enable row level security;
revoke all on public.favorites from public,anon,authenticated;
grant select,delete on public.favorites to authenticated;
grant insert(listing_id) on public.favorites to authenticated;
create policy own_favorites_read on public.favorites for select to authenticated using (user_id=(select auth.uid()));
create policy own_favorites_remove on public.favorites for delete to authenticated using (user_id=(select auth.uid()));
create policy own_favorites_add on public.favorites for insert to authenticated with check (user_id=(select auth.uid()));
create function private.favorite_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin
  select title,price,status into strict new.title,new.price,new.status from public.listings where id=new.listing_id and status='published' for share;
  return new;
end $$;
create trigger favorite_snapshot before insert on public.favorites for each row execute function private.favorite_snapshot();
create function private.favorite_sync() returns trigger language plpgsql security definer set search_path='' as $$
begin
  update public.favorites set status=new.status,
    title=case when new.status='published' then new.title else title end,
    price=case when new.status='published' then new.price else price end where listing_id=new.id;
  return new;
end $$;
create trigger favorite_sync after update of status,title,price on public.listings for each row execute function private.favorite_sync();
revoke all on function private.favorite_sync(),private.favorite_snapshot() from public,anon,authenticated;

create table private.balance_credits (
  request_id uuid primary key,
  admin_id uuid not null,
  recipient uuid not null references auth.users,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
revoke all on private.balance_credits from public, anon, authenticated;

create function private.market_credit(recipient uuid, amount numeric, request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_admin() then raise exception 'Yönetici yetkisi gerekli.'; end if;
  if amount is null or amount <= 0 or amount <> round(amount,2) or amount > 9999999999 then raise exception 'Geçersiz tutar.'; end if;
  insert into private.balance_credits values (request_id,auth.uid(),recipient,amount,now())
    on conflict do nothing;
  if found then
    update public.account_balances b set balance=b.balance+amount where user_id=recipient;
    if not found then raise exception 'Bakiye hesabı bulunamadı.'; end if;
  end if;
end $$;

create function private.market_buy(item uuid, expected_price numeric)
returns void language plpgsql security definer set search_path = '' as $$
declare ad public.listings; buyer uuid := auth.uid();
begin
  select * into ad from public.listings where id=item for update;
  if buyer is null or ad.status is distinct from 'published' or ad.seller_id=buyer then raise exception 'Bu ilan satın alınamaz.'; end if;
  if ad.price is distinct from expected_price then raise exception 'Fiyat değişti. İlanı yenileyin.'; end if;
  update public.account_balances set balance=balance-ad.price where user_id=buyer and balance>=ad.price;
  if not found then raise exception 'Yetersiz bakiye.'; end if;
  insert into public.market_orders(listing_id,buyer_id,seller_id,title,cover_path,amount,status)
    values(item,buyer,ad.seller_id,ad.title,(select object_path from public.listing_images where listing_id=item order by sort_order limit 1),ad.price,'pending');
  update public.listings set status='archived' where id=item;
end $$;

create function private.market_transition(order_id uuid, action text)
returns void language plpgsql security definer set search_path = '' as $$
declare sale public.market_orders; actor uuid := auth.uid(); next_state text; recipient uuid;
begin
  select * into sale from public.market_orders where id=order_id for update;
  if actor=sale.seller_id and sale.status='pending' and action='accept' then next_state:='accepted';
  elsif actor=sale.seller_id and sale.status in ('pending','accepted') and action='reject' then next_state:='rejected'; recipient:=sale.buyer_id;
  elsif actor=sale.buyer_id and sale.status='pending' and action='cancel' then next_state:='cancelled'; recipient:=sale.buyer_id;
  elsif actor=sale.buyer_id and sale.status='accepted' and action='confirm' then next_state:='completed'; recipient:=sale.seller_id;
  else raise exception 'Bu işlem bu aşamada yapılamaz.'; end if;
  if recipient is not null then
    update public.account_balances set balance=balance+sale.amount where user_id=recipient;
    if not found then raise exception 'Bakiye hesabı bulunamadı.'; end if;
    update public.listings set status=case when next_state='completed' then 'sold' else 'published' end where id=sale.listing_id;
  end if;
  update public.market_orders set status=next_state where id=order_id;
end $$;

-- Check all orders even for administrators and users outside the order's read policy.
create function private.guard_order_listing() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.market_orders where listing_id=old.id and status in ('pending','accepted','completed'))
    then raise exception 'İşleme bağlı ilan değiştirilemez.'; end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger guard_order_delete before delete on public.listings for each row execute function private.guard_order_listing();
create trigger guard_order_listing before update on public.listings for each row
  when (current_user in ('authenticated','anon')) execute function private.guard_order_listing();
revoke all on function private.guard_order_listing() from public,anon,authenticated;

create function private.order_image_unlocked(path text) returns boolean
language sql stable security definer set search_path='' as $$
  select not exists(select 1 from public.listing_images i join public.market_orders o on o.listing_id=i.listing_id
    where i.object_path=path and o.status in ('pending','accepted','completed'));
$$;
revoke all on function private.order_image_unlocked(text) from public,anon;
grant execute on function private.order_image_unlocked(text) to authenticated;
create policy order_cover_read on storage.objects for select to authenticated using (
  bucket_id='listing-images' and exists(select 1 from public.market_orders o where o.cover_path=name and (select auth.uid()) in (o.buyer_id,o.seller_id))
);
create policy protect_order_objects on storage.objects as restrictive for delete to authenticated
  using(bucket_id <> 'listing-images' or private.order_image_unlocked(name));
create policy protect_order_images on public.listing_images as restrictive for delete to authenticated
  using(private.order_image_unlocked(object_path));

create function public.market_buy(item uuid, expected_price numeric) returns void language sql security invoker set search_path='' as $$select private.market_buy(item,expected_price)$$;
create function public.market_transition(order_id uuid,action text) returns void language sql security invoker set search_path='' as $$select private.market_transition(order_id,action)$$;
create function public.market_credit(recipient uuid,amount numeric,request_id uuid) returns void language sql security invoker set search_path='' as $$select private.market_credit(recipient,amount,request_id)$$;
revoke all on function public.market_buy(uuid,numeric), private.market_buy(uuid,numeric), public.market_transition(uuid,text), private.market_transition(uuid,text), public.market_credit(uuid,numeric,uuid), private.market_credit(uuid,numeric,uuid) from public,anon,authenticated;
grant execute on function public.market_buy(uuid,numeric), private.market_buy(uuid,numeric), public.market_transition(uuid,text), private.market_transition(uuid,text), public.market_credit(uuid,numeric,uuid), private.market_credit(uuid,numeric,uuid) to authenticated;
