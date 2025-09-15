-- Align legacy payments schema (plan_id) with new schema (plan)
alter table if exists public.payments
  add column if not exists plan text check (plan in ('pro','pro_plus'));

-- If plan_id exists, drop NOT NULL to allow inserts that only set plan
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='payments' AND column_name='plan_id'
  ) THEN
    EXECUTE 'alter table public.payments alter column plan_id drop not null';
  END IF;
END $$;

-- Create or replace backfill function and trigger unconditionally (idempotent)
CREATE OR REPLACE FUNCTION public.payments_plan_backfill() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.plan_id IS NULL AND NEW.plan IS NOT NULL THEN
      NEW.plan_id := NEW.plan;
    END IF;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_payments_plan_backfill ON public.payments;
CREATE TRIGGER trg_payments_plan_backfill
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.payments_plan_backfill();


