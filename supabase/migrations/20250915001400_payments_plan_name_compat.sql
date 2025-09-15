-- Make payments.plan_name optional and auto-fill from plan when missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='payments' AND column_name='plan_name'
  ) THEN
    EXECUTE 'alter table public.payments alter column plan_name drop not null';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.payments_plan_name_backfill() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.plan_name IS NULL AND NEW.plan IS NOT NULL THEN
    NEW.plan_name := CASE NEW.plan WHEN 'pro' THEN 'Pro' WHEN 'pro_plus' THEN 'Pro+' ELSE NEW.plan END;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_payments_plan_name_backfill ON public.payments;
CREATE TRIGGER trg_payments_plan_name_backfill
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.payments_plan_name_backfill();


