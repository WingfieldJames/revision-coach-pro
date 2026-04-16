-- =============================================================================
-- Migration: Fix overly permissive RLS on admin/internal tables
-- Date: 2026-04-16
--
-- Problem: Several internal tables had `FOR ALL USING (true)` policies,
-- granting any authenticated user full CRUD access to admin data like
-- metrics, flagged responses, prompt improvements, and churn notifications.
--
-- Fix: Drop the overly permissive policies and replace with admin-only
-- read access. Write access relies on service role (edge functions).
-- =============================================================================

-- seasonal_prompts: only admins can read, service role writes
DROP POLICY IF EXISTS "Service role full access" ON public.seasonal_prompts;
CREATE POLICY "Admins can view seasonal prompts"
  ON public.seasonal_prompts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')));

-- content_gaps: only admins can read
DROP POLICY IF EXISTS "Service role full access" ON public.content_gaps;
CREATE POLICY "Admins can view content gaps"
  ON public.content_gaps FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')));

-- metrics_snapshots: only admins can read
DROP POLICY IF EXISTS "Service role full access" ON public.metrics_snapshots;
DROP POLICY IF EXISTS "Anyone can insert snapshots" ON public.metrics_snapshots;
CREATE POLICY "Admins can view metrics"
  ON public.metrics_snapshots FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')));

-- flagged_responses: only admins can read
DROP POLICY IF EXISTS "Service role full access" ON public.flagged_responses;
CREATE POLICY "Admins can view flagged responses"
  ON public.flagged_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')));

-- prompt_improvements: only admins can read (rag-chat reads via service role)
DROP POLICY IF EXISTS "Service role full access" ON public.prompt_improvements;
CREATE POLICY "Admins can view prompt improvements"
  ON public.prompt_improvements FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')));

-- conversion_nudges: only admins can read
DROP POLICY IF EXISTS "Service role full access" ON public.conversion_nudges;
CREATE POLICY "Admins can view conversion nudges"
  ON public.conversion_nudges FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')));

-- churn_notifications: only admins can read
DROP POLICY IF EXISTS "Service role full access" ON public.churn_notifications;
CREATE POLICY "Admins can view churn notifications"
  ON public.churn_notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')));

-- content_scripts: restrict update/delete to creator only
DROP POLICY IF EXISTS "Authenticated users can update content scripts" ON public.content_scripts;
DROP POLICY IF EXISTS "Authenticated users can delete content scripts" ON public.content_scripts;
CREATE POLICY "Users can update own content scripts"
  ON public.content_scripts FOR UPDATE
  USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own content scripts"
  ON public.content_scripts FOR DELETE
  USING (auth.uid() = created_by);
