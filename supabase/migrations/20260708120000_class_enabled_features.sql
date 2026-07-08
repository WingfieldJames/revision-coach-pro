-- =============================================================================
-- Migration: per-class feature control for the Schools B2B student Coach
-- Date: 2026-07-08
-- =============================================================================
-- Adds an optional per-class whitelist of which Coach tools students can see,
-- so a teacher can tailor each class (diagram generator, past papers, revision
-- guide, mock exam, etc.). Additive; nullable.
--
-- Semantics: enabled_features IS NULL  -> show all tools the product supports
--            (the existing behaviour; existing/demo classes are unaffected).
--            enabled_features = '{...}' -> show only the listed tool ids.
--
-- The essay marker (writing aid) is intentionally NOT governed by this column —
-- it stays gated by class_ai_settings.writing_aid_unlocked (default LOCKED, §3.5).
-- Feature ids match src/components/schools/StudentCoach.tsx selected_features
-- (e.g. 'my_ai','diagram_generator','past_papers','revision_guide',
-- 'exam_countdown','grade_boundaries','my_mistakes','mock_exam').

ALTER TABLE public.class_ai_settings
  ADD COLUMN IF NOT EXISTS enabled_features text[];
