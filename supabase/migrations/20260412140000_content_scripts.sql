-- =============================================================================
-- Migration: Content scripts for short-form video hooks
-- Date: 2026-04-12
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.content_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  exam_board TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Economics',
  hook_type TEXT NOT NULL DEFAULT 'question',
  script_text TEXT NOT NULL,
  hook_line TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'filmed', 'published')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view content scripts"
  ON public.content_scripts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert content scripts"
  ON public.content_scripts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update content scripts"
  ON public.content_scripts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete content scripts"
  ON public.content_scripts FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_content_scripts_topic ON public.content_scripts(topic, exam_board);
CREATE INDEX idx_content_scripts_status ON public.content_scripts(status);
