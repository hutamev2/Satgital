-- Restore the admin balance-credit RPC independently from the marketplace rollout.
-- Safe to run after the full marketplace migration as well.
create table if not exists private.balance_credits (
  request_id uuid primary key,
  admin_id uuid not null,
  recipient uuid not null references auth.users,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

revoke all on private.balance_credits from public, anon, authenticated;

create or replace function private.market_credit(recipient uuid, amount numeric, request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_admin() then
    raise exception 'Yönetici yetkisi gerekli.';
  end if;

  if amount is null or amount <= 0 or amount <> round(amount, 2) or amount > 9999999999 then
    raise exception 'Geçersiz tutar.';
  end if;

  insert into private.balance_credits(request_id, admin_id, recipient, amount)
  values (request_id, auth.uid(), recipient, amount)
  on conflict do nothing;

  if found then
    update public.account_balances
    set balance = balance + amount
    where user_id = recipient;

    if not found then
      raise exception 'Bakiye hesabı bulunamadı.';
    end if;
  end if;
end
$$;

create or replace function public.market_credit(recipient uuid, amount numeric, request_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.market_credit(recipient, amount, request_id)
$$;

revoke all on function public.market_credit(uuid,numeric,uuid) from public, anon, authenticated;
revoke all on function private.market_credit(uuid,numeric,uuid) from public, anon, authenticated;
grant execute on function public.market_credit(uuid,numeric,uuid) to authenticated;
grant execute on function private.market_credit(uuid,numeric,uuid) to authenticated;

notify pgrst, 'reload schema';
