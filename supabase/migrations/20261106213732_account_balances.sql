create table public.account_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(12,2) not null default 0 check (balance >= 0)
);
alter table public.account_balances enable row level security;
revoke all on public.account_balances from anon, authenticated;
grant select on public.account_balances to authenticated;
create policy balance_read_own on public.account_balances for select to authenticated using ((select auth.uid()) = user_id);
insert into public.account_balances(user_id) select id from auth.users;
create function private.initialize_balance() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.account_balances(user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
revoke all on function private.initialize_balance() from public, anon, authenticated;
create trigger initialize_account_balance after insert on auth.users for each row execute function private.initialize_balance();
create trigger sync_profile_metadata after update of raw_user_meta_data on auth.users for each row execute function private.handle_new_user();
