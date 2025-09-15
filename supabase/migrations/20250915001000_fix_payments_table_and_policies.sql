-- Ensure payments table has expected columns and RLS policies
set check_function_bodies = off;

-- Columns
alter table if exists public.payments
  add column if not exists plan text check (plan in ('pro','pro_plus')),
  add column if not exists amount integer,
  add column if not exists currency text default 'INR',
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature text,
  add column if not exists status text check (status in ('pending','paid','verified','failed')) default 'pending',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists paid_at timestamptz,
  add column if not exists failed_reason text;

-- RLS
alter table if exists public.payments enable row level security;

drop policy if exists payments_owner_select on public.payments;
create policy payments_owner_select on public.payments
for select using (auth.uid() = user_id);

drop policy if exists payments_owner_insert on public.payments;
create policy payments_owner_insert on public.payments
for insert with check (auth.uid() = user_id);

drop policy if exists payments_owner_update on public.payments;
create policy payments_owner_update on public.payments
for update using (auth.uid() = user_id);


