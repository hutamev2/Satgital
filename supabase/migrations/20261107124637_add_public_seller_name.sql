alter table public.listings
  add column seller_display_name text;

update public.listings as listing
set seller_display_name = coalesce(nullif(trim(profile.display_name), ''), 'Satgital Kullanıcısı')
from public.profiles as profile
where profile.id = listing.seller_id;

update public.listings
set seller_display_name = 'Satgital Kullanıcısı'
where seller_display_name is null;

alter table public.listings
  alter column seller_display_name set not null,
  add constraint listings_seller_display_name_length
    check (char_length(seller_display_name) between 2 and 60);

create or replace function private.set_listing_seller_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(trim(display_name), ''), 'Satgital Kullanıcısı')
  into new.seller_display_name
  from public.profiles
  where id = new.seller_id;

  if new.seller_display_name is null then
    new.seller_display_name := 'Satgital Kullanıcısı';
  end if;

  return new;
end;
$$;

revoke all on function private.set_listing_seller_display_name() from public, anon, authenticated;

create trigger listings_set_seller_display_name
  before insert or update of seller_id on public.listings
  for each row execute function private.set_listing_seller_display_name();

create or replace function private.sync_profile_listing_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listings
  set seller_display_name = coalesce(nullif(trim(new.display_name), ''), 'Satgital Kullanıcısı'),
      updated_at = now()
  where seller_id = new.id;
  return new;
end;
$$;

revoke all on function private.sync_profile_listing_name() from public, anon, authenticated;

create trigger profiles_sync_listing_name
  after update of display_name on public.profiles
  for each row
  when (old.display_name is distinct from new.display_name)
  execute function private.sync_profile_listing_name();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function private.handle_new_user();
