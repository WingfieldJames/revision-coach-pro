
-- =====================================================================
-- SECURITY HARDENING MIGRATION
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PRODUCTS: stop exposing proprietary system prompts publicly
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

CREATE POLICY "Public can view safe product fields"
ON public.products
FOR SELECT
TO anon, authenticated
USING (active = true);

-- Revoke direct column access to system prompts from anon/authenticated
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (
  id, name, slug, subject, exam_board,
  chatbase_free_url, chatbase_premium_url,
  stripe_monthly_price_id, stripe_lifetime_price_id,
  monthly_price, lifetime_price, active,
  created_at, updated_at, qualification_type
) ON public.products TO anon, authenticated;

-- Trainers/admins still need full access for the build UI
GRANT SELECT ON public.products TO authenticated;
-- Re-revoke and re-grant only for trainer/admin via separate path:
REVOKE SELECT ON public.products FROM authenticated;
GRANT SELECT (
  id, name, slug, subject, exam_board,
  chatbase_free_url, chatbase_premium_url,
  stripe_monthly_price_id, stripe_lifetime_price_id,
  monthly_price, lifetime_price, active,
  created_at, updated_at, qualification_type
) ON public.products TO authenticated;

-- Provide a SECURITY DEFINER RPC for trainers/admins to read full product (incl. prompts)
CREATE OR REPLACE FUNCTION public.get_product_full(_product_id uuid)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'trainer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.products WHERE id = _product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_product_full(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_product_full(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 2. TRAINER_PROJECTS: stop exposing system prompts/PII to public
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view deployed trainer projects" ON public.trainer_projects;

CREATE POLICY "Public can view deployed trainer projects (col-restricted)"
ON public.trainer_projects
FOR SELECT
TO anon, authenticated
USING (status = 'deployed');

REVOKE SELECT ON public.trainer_projects FROM anon, authenticated;
GRANT SELECT (
  id, product_id, subject, exam_board, status,
  trainer_image_url, trainer_description, trainer_name, trainer_status,
  trainer_achievements, selected_features, exam_dates, essay_marker_marks,
  qualification_type, suggested_prompts, diagram_library, active_challenge,
  grade_boundaries_data, created_at, updated_at, last_deployed_at
) ON public.trainer_projects TO anon, authenticated;

-- Trainer/admin policy still allows full row access via existing "Trainers can view projects" policy.

-- ---------------------------------------------------------------------
-- 3. CONTENT_SCRIPTS: restrict to admins/trainers (proprietary content)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "auth_select" ON public.content_scripts;
DROP POLICY IF EXISTS "auth_insert" ON public.content_scripts;
DROP POLICY IF EXISTS "auth_update" ON public.content_scripts;
DROP POLICY IF EXISTS "auth_delete" ON public.content_scripts;

CREATE POLICY "Admins/trainers can view content scripts"
ON public.content_scripts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'trainer'::app_role));

CREATE POLICY "Admins/trainers can insert content scripts"
ON public.content_scripts
FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'trainer'::app_role))
  AND created_by = auth.uid()
);

-- ---------------------------------------------------------------------
-- 4. USER_ROLES: explicit deny on writes from non-service-role
-- ---------------------------------------------------------------------
CREATE POLICY "Block client inserts to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Block client updates to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Block client deletes to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (false);

-- ---------------------------------------------------------------------
-- 5. CHANGE_LOG: remove always-true public ALL policy
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access" ON public.change_log;

CREATE POLICY "Public can read change log"
ON public.change_log
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can write change log"
ON public.change_log
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------
-- 6. AFFILIATES: remove broad authenticated read; service role still works
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can validate affiliate codes" ON public.affiliates;
-- (Validation now occurs only via edge functions using service role.)

-- ---------------------------------------------------------------------
-- 7. MOCK_PAPERS: only admins can insert
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert mock papers" ON public.mock_papers;

CREATE POLICY "Admins can insert mock papers"
ON public.mock_papers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------
-- 8. STORAGE: explicit UPDATE/DELETE policies for trainer-uploads
-- ---------------------------------------------------------------------
CREATE POLICY "Trainers can update trainer-uploads files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trainer-uploads'
  AND (public.has_role(auth.uid(), 'trainer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  bucket_id = 'trainer-uploads'
  AND (public.has_role(auth.uid(), 'trainer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Trainers can delete trainer-uploads files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'trainer-uploads'
  AND (public.has_role(auth.uid(), 'trainer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

-- ---------------------------------------------------------------------
-- 9. AFFILIATE_REFERRALS: allow affiliates to read their own referrals
-- ---------------------------------------------------------------------
CREATE POLICY "Affiliates can view own referrals"
ON public.affiliate_referrals
FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT a.id FROM public.affiliates a
    WHERE a.email = (auth.jwt() ->> 'email')
  )
);
