-- =============================================================================
-- Migration: Fix verbose AI feedback — stop repeating student answers
-- Date: 2026-04-16
--
-- Problem: Edexcel Economics system prompt tells the AI to "specifically
-- quote parts of the user's text" for every strength and weakness. This
-- causes the AI to repeat long answers back line by line before giving
-- feedback, making responses too long and slow.
--
-- Fix: Replace the quote-anchored feedback instruction with a concise
-- feedback instruction that only references specific phrases when
-- correcting errors. Applied to ALL products.
-- =============================================================================

-- Replace the verbose quoting instruction in all products that have it
UPDATE public.products
SET system_prompt_deluxe = REPLACE(
  system_prompt_deluxe,
  'When marking, you must provide a "Strengths and Weaknesses" breakdown by specifically quoting parts of the user''s text. For each quoted section, identify exactly what is effective or where it fails. You must then explain how to improve that specific section. Do not provide general feedback; ensure every piece of advice is anchored to a quote from the user''s submission.',
  'When marking, provide a concise "Strengths and Weaknesses" breakdown. Do NOT repeat or restate the student''s full answer — they already know what they wrote. Reference specific short phrases (a few words) ONLY when pointing out an error or suggesting a concrete improvement. Keep feedback direct and actionable. A focused response beats a padded one.'
),
updated_at = now()
WHERE system_prompt_deluxe LIKE '%specifically quoting parts of the user%';

-- Also replace the secondary quoting instruction
UPDATE public.products
SET system_prompt_deluxe = REPLACE(
  system_prompt_deluxe,
  'If there is something you think the student could improve on based on the Edexcel specification, explicitly quote what the student wrote and explain why this isn''t very good and what could be better.',
  'If there is something the student could improve on based on the specification, identify the specific issue and explain why it falls short and what would be better. Reference only the relevant few words, not the whole passage.'
),
updated_at = now()
WHERE system_prompt_deluxe LIKE '%explicitly quote what the student wrote%';

-- Add a universal conciseness instruction to ALL product prompts that don't have it yet
UPDATE public.products
SET system_prompt_deluxe = system_prompt_deluxe || '

--- RESPONSE CONCISENESS ---
When giving feedback on student work:
- Do NOT repeat, restate, or quote back the student''s full answer.
- Reference specific short phrases ONLY when correcting an error or suggesting an improvement.
- Jump straight to the mark, strengths, weaknesses, and how to improve.
- Keep responses focused and actionable. Quality over quantity.',
updated_at = now()
WHERE system_prompt_deluxe IS NOT NULL
  AND system_prompt_deluxe NOT LIKE '%RESPONSE CONCISENESS%';
