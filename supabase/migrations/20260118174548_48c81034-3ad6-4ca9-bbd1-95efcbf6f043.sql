-- Create table to track daily prompt usage
CREATE TABLE public.daily_prompt_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id),
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prompt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.daily_prompt_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
ON public.daily_prompt_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_daily_prompt_usage_lookup 
ON public.daily_prompt_usage(user_id, product_id, usage_date);

-- Create function to increment and check usage (returns current count after increment)
CREATE OR REPLACE FUNCTION public.increment_prompt_usage(
  p_user_id UUID,
  p_product_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_result JSON;
BEGIN
  -- Insert or update the usage count
  INSERT INTO public.daily_prompt_usage (user_id, product_id, usage_date, prompt_count)
  VALUES (p_user_id, p_product_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, product_id, usage_date)
  DO UPDATE SET 
    prompt_count = daily_prompt_usage.prompt_count + 1,
    updated_at = now()
  RETURNING prompt_count INTO v_current_count;
  
  -- Return result with count and whether limit exceeded
  v_result := json_build_object(
    'count', v_current_count,
    'limit', p_limit,
    'exceeded', v_current_count > p_limit
  );
  
  RETURN v_result;
END;
$$;