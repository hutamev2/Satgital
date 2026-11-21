create table public.comparison_offers (
  source text not null check (source in ('Sahibinden', 'Letgo', 'Dolap')),
  source_listing_id text not null check (length(trim(source_listing_id)) > 0),
  title text not null check (length(trim(title)) >= 2),
  price_try numeric(12,2) not null check (price_try > 0),
  observed_at timestamptz not null,
  primary key (source, source_listing_id)
);
alter table public.comparison_offers enable row level security;
revoke all on public.comparison_offers from public, anon, authenticated;
grant select on public.comparison_offers to anon, authenticated;
create policy recent_offers on public.comparison_offers for select to anon, authenticated
  using (observed_at between now() - interval '7 days' and now());

create function public.compare_market_sources(model_query text)
returns table(source text, sample_count bigint, average_price numeric, lowest_price numeric, highest_price numeric)
language sql stable security invoker set search_path = '' as $$
  with offers as (
    select 'Satgital'::text as source, title, price from public.listings where status = 'published'
    union all
    select source, title, price_try from public.comparison_offers
      where observed_at between now() - interval '7 days' and now()
  )
  select o.source, count(*), round(avg(o.price),2), min(o.price), max(o.price)
  from offers o
  where length(trim(model_query)) between 2 and 100 and model_query ~ '[[:alnum:]]'
    and array_remove(regexp_split_to_array(lower(trim(model_query)), '[^[:alnum:]]+'), '')
      <@ regexp_split_to_array(lower(o.title), '[^[:alnum:]]+')
  group by o.source;
$$;
revoke all on function public.compare_market_sources(text) from public;
grant execute on function public.compare_market_sources(text) to anon, authenticated;
notify pgrst, 'reload schema';
