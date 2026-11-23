alter table public.listings drop constraint if exists listings_title_check;
alter table public.listings add constraint listings_title_check check (char_length(title) between 3 and 80);

create function public.suggest_listing_price(model_query text, product_condition text default null)
returns table(suggested_price numeric, sample_count bigint, matched_condition boolean)
language sql stable security invoker set search_path = '' as $$
  with query as (
    select lower(translate(trim(model_query), 'İI', 'ii')) as model
  ), offers as (
    select title, price, condition from public.listings where status='published'
    union all
    select title, price_try, null from public.comparison_offers
    where observed_at between now() - interval '7 days' and now()
  ), normalized as (
    select price, condition,
      regexp_replace(regexp_replace(lower(translate(title,'İI','ii')), 'iphone([0-9])', 'iphone \1', 'g'),
        '([0-9])[[:space:]]+(gb|tb)\M', '\1\2', 'g') as title from offers
  ), matches as (
    select n.price, coalesce(n.condition=product_condition,false) as same_condition
    from normalized n cross join query q
    where length(q.model) between 2 and 100 and q.model ~ '[[:alnum:]]'
      and array_remove(regexp_split_to_array(q.model,'[^[:alnum:]]+'),'')
          <@ regexp_split_to_array(n.title,'[^[:alnum:]]+')
      and (q.model !~ 'iphone' or (
        (n.title ~ '\mpro\M') = (q.model ~ '\mpro\M')
        and (n.title ~ '\mmax\M') = (q.model ~ '\mmax\M')
        and (n.title ~ '\mmini\M') = (q.model ~ '\mmini\M')
        and (n.title ~ '\mplus\M') = (q.model ~ '\mplus\M')
        and n.title !~ '\m(kılıf|kilif|kılıfı|koruyucu|ekranı|batarya|bataryası|yedek parça|kablo|maket|replika)\M'
      ))
  ), preference as (
    select count(*) filter (where same_condition) >= 3 as use_condition from matches
  )
  select round((percentile_cont(0.5) within group (order by price))::numeric),
    count(*), coalesce(bool_or(use_condition), false)
  from matches cross join preference where not use_condition or same_condition;
$$;
revoke all on function public.suggest_listing_price(text,text) from public;
grant execute on function public.suggest_listing_price(text,text) to authenticated;
notify pgrst,'reload schema';
