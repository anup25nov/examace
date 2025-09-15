-- Memberships and Payments schema for Razorpay UPI integration
-- Plans: pro (limit 3), pro_plus (limit 5)

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('pro','pro_plus')),
  start_date date not null,
  end_date date not null,
  mocks_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('pro','pro_plus')),
  amount integer not null,
  currency text not null default 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status text not null check (status in ('pending','paid','verified','failed')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  failed_reason text
);

-- Helper: plan limit
create or replace function public.get_plan_limit(p_plan text)
returns integer language sql as $$
  select case p_plan when 'pro' then 3 when 'pro_plus' then 5 else 0 end;
$$;

-- Activate or upgrade membership according to business rules
create or replace function public.activate_or_upgrade_membership(p_user uuid, p_plan text, p_upgrade_at timestamptz)
returns table (plan text, start_date date, end_date date, mocks_used integer) language plpgsql as $$
declare
  v_now date := (p_upgrade_at at time zone 'IST')::date;
  v_existing memberships;
  v_new_start date;
  v_new_end date;
begin
  select * into v_existing from memberships where user_id = p_user;

  if v_existing is null then
    v_new_start := v_now;
    v_new_end := v_now + interval '1 year';
    insert into memberships(user_id, plan, start_date, end_date, mocks_used)
    values (p_user, p_plan, v_new_start, v_new_end, 0)
    returning memberships.plan, memberships.start_date, memberships.end_date, memberships.mocks_used into plan, start_date, end_date, mocks_used;
    return next;
    return;
  end if;

  -- Upgrade flow: if upgrading from pro to pro_plus, extend validity 1 year from upgrade date, keep mocks_used
  if v_existing.plan = 'pro' and p_plan = 'pro_plus' then
    v_new_start := v_now;
    v_new_end := v_now + interval '1 year';
    update memberships
      set plan = 'pro_plus', start_date = v_new_start, end_date = v_new_end, updated_at = now()
      where user_id = p_user
      returning memberships.plan, memberships.start_date, memberships.end_date, memberships.mocks_used into plan, start_date, end_date, mocks_used;
    return next; return;
  end if;

  -- Same plan purchase or pro_plus renewal: set 1 year from now
  if p_plan = v_existing.plan then
    v_new_start := v_now;
    v_new_end := v_now + interval '1 year';
    update memberships
      set start_date = v_new_start, end_date = v_new_end, updated_at = now()
      where user_id = p_user
      returning memberships.plan, memberships.start_date, memberships.end_date, memberships.mocks_used into plan, start_date, end_date, mocks_used;
    return next; return;
  end if;

  -- If trying to downgrade or other transitions, just set to requested plan for 1 year, keep mocks_used
  v_new_start := v_now;
  v_new_end := v_now + interval '1 year';
  update memberships
    set plan = p_plan, start_date = v_new_start, end_date = v_new_end, updated_at = now()
    where user_id = p_user
    returning memberships.plan, memberships.start_date, memberships.end_date, memberships.mocks_used into plan, start_date, end_date, mocks_used;
  return next;
end;
$$;

-- Attempt to use one mock: checks limits and increments on success
create or replace function public.attempt_use_mock(p_user uuid)
returns table(allowed boolean, message text, plan text, mocks_used integer, plan_limit integer, end_date date) language plpgsql as $$
declare
  v_m memberships;
  v_limit integer;
  v_today date := (now() at time zone 'IST')::date;
begin
  select * into v_m from memberships where user_id = p_user;
  if v_m is null then
    allowed := false; message := 'No active membership.'; plan := null; mocks_used := 0; plan_limit := 0; end_date := null; return next; return;
  end if;
  v_limit := get_plan_limit(v_m.plan);
  if v_today > v_m.end_date then
    allowed := false; message := 'Plan expired, please renew.'; plan := v_m.plan; mocks_used := v_m.mocks_used; plan_limit := v_limit; end_date := v_m.end_date; return next; return;
  end if;
  if v_m.mocks_used < v_limit then
    update memberships set mocks_used = v_m.mocks_used + 1, updated_at = now() where user_id = p_user returning memberships.mocks_used into mocks_used;
    allowed := true; message := 'Allowed'; plan := v_m.plan; plan_limit := v_limit; end_date := v_m.end_date; return next; return;
  else
    allowed := false; message := case when v_m.plan = 'pro' then 'Pro limit reached, please upgrade to Pro+' else 'Plan expired, please renew.' end; plan := v_m.plan; mocks_used := v_m.mocks_used; plan_limit := v_limit; end_date := v_m.end_date; return next; return;
  end if;
end;
$$;

-- Basic RLS (adjust as needed)
alter table memberships enable row level security;
alter table payments enable row level security;

drop policy if exists memberships_owner on memberships;
create policy memberships_owner on memberships for select using (auth.uid() = user_id);

drop policy if exists memberships_owner_mod on memberships;
create policy memberships_owner_mod on memberships for update using (auth.uid() = user_id);

drop policy if exists payments_owner on payments;
create policy payments_owner on payments for select using (auth.uid() = user_id);


