create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.profiles to authenticated;

create policy admin_users_read_self on public.admin_users
  for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

create policy profiles_read_admin on public.profiles
  for select to authenticated
  using ((select private.is_admin()));

create policy listings_read_admin on public.listings
  for select to authenticated
  using ((select private.is_admin()));

create policy listings_update_admin on public.listings
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy listings_delete_admin on public.listings
  for delete to authenticated
  using ((select private.is_admin()));

create policy listing_images_read_admin on public.listing_images
  for select to authenticated
  using ((select private.is_admin()));

create policy listing_images_delete_admin on public.listing_images
  for delete to authenticated
  using ((select private.is_admin()));

create policy listing_storage_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-images' and (select private.is_admin()));

create or replace function private.can_read_listing_image(path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.listing_images li
    join public.listings l on l.id = li.listing_id
    where li.object_path = path
      and (
        l.status = 'published'
        or li.owner_id = (select auth.uid())
        or (select private.is_admin())
      )
  );
$$;

revoke all on function private.can_read_listing_image(text) from public;
grant execute on function private.can_read_listing_image(text) to anon, authenticated;
