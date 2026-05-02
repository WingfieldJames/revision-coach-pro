CREATE OR REPLACE FUNCTION public.increment_prompt_usage(
  p_user_id uuid,
  p_product_id uuid,
  p_limit integer DEFAULT 3
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_count integer := 0;
  v_new_count integer := 0;
  v_usage_date date := CURRENT_DATE;
  v_auth_role text := auth.role();
BEGIN
  IF v_auth_role = 'anon' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_auth_role = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot update usage for another user';
  END IF;

  SELECT prompt_count INTO v_current_count
  FROM public.daily_prompt_usage
  WHERE user_id = p_user_id
    AND product_id = p_product_id
    AND usage_date = v_usage_date;

  v_current_count := COALESCE(v_current_count, 0);

  IF v_current_count >= p_limit THEN
    RETURN json_build_object('count', v_current_count, 'limit', p_limit, 'exceeded', true);
  END IF;

  INSERT INTO public.daily_prompt_usage (user_id, product_id, usage_date, prompt_count)
  VALUES (p_user_id, p_product_id, v_usage_date, 1)
  ON CONFLICT (user_id, product_id, usage_date)
  DO UPDATE SET prompt_count = daily_prompt_usage.prompt_count + 1, updated_at = now()
  RETURNING prompt_count INTO v_new_count;

  RETURN json_build_object('count', v_new_count, 'limit', p_limit, 'exceeded', false);
END;
$$;

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
  v_current_count integer := 0;
  v_new_count integer := 0;
  v_usage_month date := date_trunc('month', CURRENT_DATE)::date;
  v_auth_role text := auth.role();
BEGIN
  IF v_auth_role = 'anon' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_auth_role = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot update usage for another user';
  END IF;

  SELECT usage_count INTO v_current_count
  FROM public.monthly_tool_usage
  WHERE user_id = p_user_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL))
    AND tool_type = p_tool_type
    AND usage_month = v_usage_month;

  v_current_count := COALESCE(v_current_count, 0);

  IF v_current_count >= p_limit THEN
    RETURN json_build_object('count', v_current_count, 'limit', p_limit, 'exceeded', true);
  END IF;

  INSERT INTO public.monthly_tool_usage (user_id, product_id, tool_type, usage_month, usage_count)
  VALUES (p_user_id, p_product_id, p_tool_type, v_usage_month, 1)
  ON CONFLICT (user_id, product_id, tool_type, usage_month)
  DO UPDATE SET usage_count = monthly_tool_usage.usage_count + 1, updated_at = now()
  RETURNING usage_count INTO v_new_count;

  RETURN json_build_object('count', v_new_count, 'limit', p_limit, 'exceeded', false);
END;
$$;

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
  v_current_count integer := 0;
  v_usage_month date := date_trunc('month', CURRENT_DATE)::date;
  v_auth_role text := auth.role();
BEGIN
  IF v_auth_role = 'anon' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_auth_role = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot view usage for another user';
  END IF;

  SELECT usage_count INTO v_current_count
  FROM public.monthly_tool_usage
  WHERE user_id = p_user_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL))
    AND tool_type = p_tool_type
    AND usage_month = v_usage_month;

  RETURN json_build_object('count', COALESCE(v_current_count, 0));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_prompt_usage(uuid, uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_tool_usage(uuid, uuid, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_tool_usage(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_prompt_usage(uuid, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_tool_usage(uuid, uuid, text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_tool_usage(uuid, uuid, text) TO authenticated, service_role;