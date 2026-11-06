create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id bigint generated always as identity primary key,
  parent_id bigint references public.categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  unique nulls not distinct (parent_id, name)
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  category_id bigint not null references public.categories(id) on delete restrict,
  title text not null check (char_length(title) between 10 and 80),
  description text not null check (char_length(description) between 20 and 5000),
  condition text not null check (condition in ('Yeni gibi', 'Çok iyi', 'İyi', 'Kullanılmış')),
  warranty text not null check (warranty in ('Devam ediyor', 'Bitti', 'Yok')),
  price numeric(12,2) not null check (price > 0),
  city text not null check (char_length(city) between 2 and 60),
  status text not null default 'draft' check (status in ('draft', 'published', 'sold', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create table public.listing_images (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  object_path text not null unique,
  sort_order smallint not null check (sort_order between 0 and 7),
  created_at timestamptz not null default now(),
  unique (listing_id, sort_order)
);

create index categories_parent_id_idx on public.categories(parent_id);
create index listings_seller_id_idx on public.listings(seller_id);
create index listings_category_id_idx on public.listings(category_id);
create index listings_published_created_idx on public.listings(created_at desc) where status = 'published';
create index listing_images_listing_id_idx on public.listing_images(listing_id);
create index listing_images_owner_id_idx on public.listing_images(owner_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

revoke all on public.profiles, public.categories, public.listings, public.listing_images from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.listings, public.listing_images to anon, authenticated;
grant insert, update, delete on public.profiles, public.listings, public.listing_images to authenticated;
grant usage, select on sequence public.listing_images_id_seq to authenticated;

create policy categories_read_active on public.categories for select to anon, authenticated using (is_active);
create policy profiles_read_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy listings_read_published_or_own on public.listings for select to anon, authenticated
  using (status = 'published' or (select auth.uid()) = seller_id);
create policy listings_insert_own on public.listings for insert to authenticated
  with check ((select auth.uid()) = seller_id and status = 'draft');
create policy listings_update_own on public.listings for update to authenticated
  using ((select auth.uid()) = seller_id) with check ((select auth.uid()) = seller_id);
create policy listings_delete_own on public.listings for delete to authenticated using ((select auth.uid()) = seller_id);
create policy listing_images_read_published_or_own on public.listing_images for select to anon, authenticated
  using ((select auth.uid()) = owner_id or exists (
    select 1 from public.listings l where l.id = listing_id and l.status = 'published'
  ));
create policy listing_images_insert_own on public.listing_images for insert to authenticated
  with check ((select auth.uid()) = owner_id and exists (
    select 1 from public.listings l where l.id = listing_id and l.seller_id = (select auth.uid())
  ));
create policy listing_images_update_own on public.listing_images for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy listing_images_delete_own on public.listing_images for delete to authenticated using ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_read_listing_image(path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.listing_images li
    join public.listings l on l.id = li.listing_id
    where li.object_path = path and (l.status = 'published' or li.owner_id = (select auth.uid()))
  );
$$;
revoke all on function private.can_read_listing_image(text) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.can_read_listing_image(text) to anon, authenticated;

create policy listing_storage_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'listing-images' and (select private.can_read_listing_image(name)));
create policy listing_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy listing_storage_update on storage.objects for update to authenticated
  using (bucket_id = 'listing-images' and owner_id = (select auth.uid()::text))
  with check (bucket_id = 'listing-images' and owner_id = (select auth.uid()::text));
create policy listing_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and owner_id = (select auth.uid()::text));

insert into public.categories (name, slug, sort_order) values
  ('Cep Telefonu', 'cep-telefonu', 10), ('Bilgisayar', 'bilgisayar', 20), ('Ev & Yaşam', 'ev-yasam', 30),
  ('Giyim', 'giyim', 40), ('Otomotiv', 'otomotiv', 50), ('Oyun & Hobi', 'oyun-hobi', 60);

insert into public.categories (parent_id, name, slug, sort_order)
select p.id, c.name, c.slug, c.sort_order from public.categories p cross join (values
  ('Yenilenmiş Cep Telefonu', 'yenilenmis-cep-telefonu', 10),
  ('Yurt Dışı Cep Telefonu', 'yurt-disi-cep-telefonu', 20),
  ('İkinci El Cep Telefonu', 'ikinci-el-cep-telefonu', 30),
  ('Tuşlu Telefon', 'tuslu-telefon', 40),
  ('Cep Telefonu Aksesuarları', 'cep-telefonu-aksesuarlari', 50)
) as c(name, slug, sort_order) where p.slug = 'cep-telefonu';
