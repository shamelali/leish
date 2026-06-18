ALTER TABLE public.providers RENAME COLUMN stripe_subscription_id TO billplz_bill_id;
ALTER TABLE public.subscription_history RENAME COLUMN stripe_subscription_id TO billplz_bill_id;
