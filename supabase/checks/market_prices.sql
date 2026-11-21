begin;
insert into public.comparison_offers(source, source_listing_id, title, price_try, observed_at) values
 ('Letgo',gen_random_uuid()::text,'QA-91 Model 13',100,now()),
 ('Letgo',gen_random_uuid()::text,'QA-91 Model 13',200,now()),
 ('Letgo',gen_random_uuid()::text,'QA-91 Model 130',999,now()),
 ('Dolap',gen_random_uuid()::text,'QA-91 Model 13',999,now() - interval '8 days');
set local role anon;
do $$
declare result record;
begin
  select * into strict result from public.compare_market_sources('13 QA-91') where source='Letgo';
  if result.sample_count <> 2 or result.average_price <> 150 or result.lowest_price <> 100 or result.highest_price <> 200 then
    raise exception 'Price statistics mismatch';
  end if;
  if exists(select from public.compare_market_sources('13 QA-91') where source='Dolap') then
    raise exception 'Expired offer included';
  end if;
end $$;
rollback;
