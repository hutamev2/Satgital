-- psql -v ON_ERROR_STOP=1 -f .../import_market_prices.sql
-- Run from the directory containing the authorized UTF-8 market-prices.csv.
-- Header: source,source_listing_id,title,price_try,observed_at (ISO 8601 with timezone)
begin;
create temporary table incoming (like public.comparison_offers including constraints) on commit drop;
\copy incoming (source,source_listing_id,title,price_try,observed_at) from 'market-prices.csv' with (format csv, header true, encoding 'UTF8')
insert into public.comparison_offers as saved
select distinct on (source,source_listing_id) * from incoming
order by source,source_listing_id,observed_at desc
on conflict (source,source_listing_id) do update set
  title=excluded.title,price_try=excluded.price_try,observed_at=excluded.observed_at
where excluded.observed_at >= saved.observed_at;
commit;
