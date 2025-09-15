-- Make legacy payments.payment_id nullable if present (align with new schema using razorpay_payment_id)
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'payments' and column_name = 'payment_id'
  ) then
    begin
      execute 'alter table public.payments alter column payment_id drop not null';
    exception when undefined_column then
      -- column disappeared between releases; ignore
      null;
    end;
  end if;
end $$;


