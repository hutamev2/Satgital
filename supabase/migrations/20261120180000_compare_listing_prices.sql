create function public.compare_listing_prices(model_query text)
returns table (sample_count bigint, average_price numeric, lowest_price numeric, highest_price numeric)
language sql stable security invoker set search_path = '' as $$
  with terms as (
    select regexp_split_to_array(lower(trim(model_query)), '[^[:alnum:]]+') as words
  )
  select count(*), round(avg(l.price), 2), min(l.price), max(l.price)
  from public.listings l cross join terms
  where l.status = 'published' and l.price > 0
    and length(trim(model_query)) between 2 and 100
    and model_query ~ '[[:alnum:]]'
    and array_remove(terms.words, '') <@ regexp_split_to_array(lower(l.title), '[^[:alnum:]]+');
$$;
revoke all on function public.compare_listing_prices(text) from public;
grant execute on function public.compare_listing_prices(text) to anon, authenticated;
notify pgrst, 'reload schema';
