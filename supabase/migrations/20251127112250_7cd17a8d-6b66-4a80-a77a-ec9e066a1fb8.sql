-- Create affiliates table
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  commission_rate DECIMAL NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active affiliates (to validate codes)
CREATE POLICY "Anyone can view active affiliates"
  ON public.affiliates
  FOR SELECT
  USING (active = true);

-- Create affiliate_referrals table
CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  stripe_session_id TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on affiliate_referrals
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- No public access to affiliate_referrals (service role only)

-- Insert Zac as the first affiliate with 40% commission
INSERT INTO public.affiliates (name, code, email, commission_rate, active)
VALUES ('Zac', 'zac', 'z.f.cotta@lse.ac.uk', 0.40, true);