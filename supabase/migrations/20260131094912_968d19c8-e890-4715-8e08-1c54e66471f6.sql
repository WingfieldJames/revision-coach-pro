-- Create table for tracking monthly tool usage (diagram generator, essay marker)
CREATE TABLE public.monthly_tool_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id),
  tool_type text NOT NULL, -- 'diagram_generator' or 'essay_marker'
  usage_month date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, tool_type, usage_month)
);

-- Enable RLS
ALTER TABLE public.monthly_tool_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own tool usage" 
ON public.monthly_tool_usage 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to increment and check monthly tool usage
CREATE OR REPLACE FUNCTION public.increment_tool_usage(
  p_user_id uuid, 
  p_product_id uuid, 
  p_tool_type text,
  p_limit integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_count INTEGER;
  v_usage_month DATE := date_trunc('month', CURRENT_DATE)::date;
  v_result JSON;
BEGIN
  -- Insert or update the usage count
  INSERT INTO public.monthly_tool_usage (user_id, product_id, tool_type, usage_month, usage_count)
  VALUES (p_user_id, p_product_id, p_tool_type, v_usage_month, 1)
  ON CONFLICT (user_id, product_id, tool_type, usage_month)
  DO UPDATE SET 
    usage_count = monthly_tool_usage.usage_count + 1,
    updated_at = now()
  RETURNING usage_count INTO v_current_count;
  
  -- Return result with count and whether limit exceeded
  v_result := json_build_object(
    'count', v_current_count,
    'limit', p_limit,
    'exceeded', v_current_count > p_limit
  );
  
  RETURN v_result;
END;
$$;

-- Create function to get current month's usage without incrementing
CREATE OR REPLACE FUNCTION public.get_tool_usage(
  p_user_id uuid, 
  p_product_id uuid, 
  p_tool_type text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_count INTEGER;
  v_usage_month DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  SELECT usage_count INTO v_current_count
  FROM public.monthly_tool_usage
  WHERE user_id = p_user_id 
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL))
    AND tool_type = p_tool_type
    AND usage_month = v_usage_month;
  
  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;
  
  RETURN json_build_object('count', v_current_count);
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_monthly_tool_usage_updated_at
BEFORE UPDATE ON public.monthly_tool_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();