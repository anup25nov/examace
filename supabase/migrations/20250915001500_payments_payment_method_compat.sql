-- Make payments.payment_method optional and default to 'upi' if missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='payments' AND column_name='payment_method'
  ) THEN
    EXECUTE 'alter table public.payments alter column payment_method drop not null';
    EXECUTE 'alter table public.payments alter column payment_method set default ''upi''' ;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.payments_method_backfill() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.payment_method IS NULL THEN
    NEW.payment_method := 'upi';
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_payments_method_backfill ON public.payments;
CREATE TRIGGER trg_payments_method_backfill
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.payments_method_backfill();


