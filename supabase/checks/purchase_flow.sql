-- Run as postgres in one session. All fixtures and balance movements roll back.
begin;
select set_config('test.buyer', gen_random_uuid()::text, true),
       set_config('test.seller', gen_random_uuid()::text, true),
       set_config('test.item', gen_random_uuid()::text, true);
insert into auth.users(id, email)
select id, id::text || '@example.invalid'
from (values (current_setting('test.buyer')::uuid), (current_setting('test.seller')::uuid)) u(id);
update public.account_balances set balance = 100 where user_id = current_setting('test.buyer')::uuid;
insert into public.listings(id, seller_id, category_id, title, description, condition, warranty, price, city, status, published_at)
values (current_setting('test.item')::uuid, current_setting('test.seller')::uuid,
  (select min(id) from public.categories where is_active), 'Test ürünü 123', 'Satın alma zinciri için geçici ilan.', 'Yeni gibi', 'Yok', 40, 'Ankara', 'published', now());

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.buyer'), true);
select public.market_buy(current_setting('test.item')::uuid, 40);
select set_config('test.order', (select id::text from public.market_orders where listing_id = current_setting('test.item')::uuid and status = 'pending'), true);
do $$ begin
  if (select balance from public.account_balances where user_id = auth.uid()) is distinct from 60 then raise exception 'Buyer debit failed'; end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('test.seller'), true);
select public.market_transition(current_setting('test.order')::uuid, 'accept');
do $$ begin
  if (select balance from public.account_balances where user_id = auth.uid()) is distinct from 0 then raise exception 'Premature payout'; end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('test.buyer'), true);
select public.market_transition(current_setting('test.order')::uuid, 'confirm');
reset role;
do $$ begin
  if (select status from public.market_orders where id = current_setting('test.order')::uuid) is distinct from 'completed'
    or (select status from public.listings where id = current_setting('test.item')::uuid) is distinct from 'sold'
    or (select balance from public.account_balances where user_id = current_setting('test.seller')::uuid) is distinct from 40
    then raise exception 'Settlement failed'; end if;
end $$;
rollback;
