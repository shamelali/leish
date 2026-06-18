-- Add phone and loyalty points to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_total_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_total_redeemed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ DEFAULT NOW();

-- Loyalty points configuration table
CREATE TABLE IF NOT EXISTS public.loyalty_config (
  id TEXT PRIMARY KEY,
  points_per_booking NUMERIC DEFAULT 10,
  points_value_myr NUMERIC DEFAULT 1,
  min_redemption_points INTEGER DEFAULT 100,
  tier_thresholds JSONB DEFAULT '{"bronze": 0, "silver": 500, "gold": 1500, "platinum": 3000}'::jsonb,
  tier_bonuses JSONB DEFAULT '{"bronze": 0, "silver": 10, "gold": 15, "platinum": 20}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO public.loyalty_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- Loyalty points history table
CREATE TABLE IF NOT EXISTS public.loyalty_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'adjust')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read loyalty config" ON public.loyalty_config FOR SELECT USING (true);
CREATE POLICY "Service write loyalty config" ON public.loyalty_config FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users read own points" ON public.loyalty_points_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service write points history" ON public.loyalty_points_history FOR ALL USING (true) WITH CHECK (true);

-- Function to calculate and award loyalty points on booking completion
CREATE OR REPLACE FUNCTION award_loyalty_points(p_booking_id UUID)
RETURNS void AS $$
DECLARE
  v_customer_id UUID;
  v_total_amount NUMERIC;
  v_points_earned INTEGER;
  v_config RECORD;
BEGIN
  -- Get booking and customer info
  SELECT b.customer_id, b.total_amount_myr INTO v_customer_id, v_total_amount
  FROM public.bookings b WHERE b.id = p_booking_id;

  IF v_customer_id IS NULL THEN
    RETURN;
  END IF;

  -- Get loyalty config
  SELECT * INTO v_config FROM public.loyalty_config WHERE id = 'default';

  -- Calculate points: 1 point per MYR spent, minimum 10 points
  v_points_earned := GREATEST(ROUND(v_total_amount)::INTEGER, 10);

  -- Update profile points
  UPDATE public.profiles 
  SET 
    points = points + v_points_earned,
    points_total_earned = points_total_earned + v_points_earned,
    loyalty_tier = calculate_loyalty_tier(points + v_points_earned)
  WHERE id = v_customer_id;

  -- Record in history
  INSERT INTO public.loyalty_points_history (user_id, booking_id, points, type, description)
  VALUES (v_customer_id, p_booking_id, v_points_earned, 'earn', 'Points earned from booking');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate loyalty tier
CREATE OR REPLACE FUNCTION calculate_loyalty_tier(p_points INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF p_points >= 3000 THEN
    RETURN 'platinum';
  ELSIF p_points >= 1500 THEN
    RETURN 'gold';
  ELSIF p_points >= 500 THEN
    RETURN 'silver';
  END IF;
  RETURN 'bronze';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to award points when booking is completed
CREATE OR REPLACE FUNCTION trigger_award_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM award_loyalty_points(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_completed_trigger ON public.bookings;
CREATE TRIGGER booking_completed_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION trigger_award_loyalty_points();