-- Migration: Add atomic booking function with row locking
-- This prevents double-booking by using SELECT FOR UPDATE within a transaction

CREATE OR REPLACE FUNCTION public.create_booking_with_lock(
  p_customer_id UUID,
  p_provider_id UUID,
  p_service_id UUID,
  p_slot_id UUID,
  p_total_amount_myr NUMERIC(10,2),
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_booking_id UUID;
  v_starts_at TIMESTAMPTZ;
  v_is_booked BOOLEAN;
BEGIN
  -- Lock the slot row and get current state
  SELECT starts_at, is_booked
  INTO v_starts_at, v_is_booked
  FROM public.availability_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  -- Check if slot exists
  IF v_starts_at IS NULL THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;

  -- Check 24-hour advance booking rule
  IF v_starts_at < NOW() + INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Bookings must be made at least 24 hours in advance';
  END IF;

  -- Check if already booked
  IF v_is_booked THEN
    RAISE EXCEPTION 'Slot is already booked';
  END IF;

  -- Create the booking
  INSERT INTO public.bookings (
    customer_id,
    provider_id,
    service_id,
    slot_id,
    status,
    notes,
    total_amount_myr,
    paid_amount_myr
  ) VALUES (
    p_customer_id,
    p_provider_id,
    p_service_id,
    p_slot_id,
    'payment_required',
    p_notes,
    p_total_amount_myr,
    0
  )
  RETURNING id INTO v_booking_id;

  -- Mark slot as booked
  UPDATE public.availability_slots
  SET is_booked = true
  WHERE id = p_slot_id;

  -- Create booking event
  INSERT INTO public.booking_events (booking_id, event_type, event_payload)
  VALUES (
    v_booking_id,
    'booking_created',
    jsonb_build_object(
      'customerId', p_customer_id,
      'providerId', p_provider_id,
      'serviceId', p_service_id,
      'slotId', p_slot_id,
      'totalAmountMyr', p_total_amount_myr
    )
  );

  RETURN v_booking_id;
END;
$$;
