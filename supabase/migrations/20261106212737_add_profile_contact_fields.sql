alter table public.profiles
  add column if not exists phone text;

alter table public.profiles
  add constraint profiles_phone_length check (phone is null or char_length(phone) between 10 and 20);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, phone)
  values (
    new.id,
    case
      when char_length(trim(new.raw_user_meta_data ->> 'full_name')) between 2 and 60
        then trim(new.raw_user_meta_data ->> 'full_name')
      when char_length(split_part(new.email, '@', 1)) between 2 and 60
        then split_part(new.email, '@', 1)
      else 'Satgital Kullanıcısı'
    end,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do update
  set display_name = excluded.display_name,
      phone = excluded.phone,
      updated_at = now();
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
