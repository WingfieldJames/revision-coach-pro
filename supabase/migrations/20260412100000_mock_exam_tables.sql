-- =============================================================================
-- Migration: Mock Exam Mode — papers, results, and auto-save tables
-- Date: 2026-04-12
-- =============================================================================

-- 1. Mock papers: stores exam paper metadata and questions
CREATE TABLE public.mock_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  exam_board TEXT NOT NULL,
  subject TEXT NOT NULL,
  paper_number INTEGER NOT NULL DEFAULT 1,
  paper_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  time_limit_minutes INTEGER NOT NULL DEFAULT 120,
  sections JSONB DEFAULT '[]'::jsonb,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- questions JSONB structure:
-- [
--   {
--     "question_number": "1a",
--     "question_text": "...",
--     "marks_available": 4,
--     "question_type": "4-marker",
--     "section": "A",
--     "extract_text": "...",
--     "diagram_required": false
--   }
-- ]

-- sections JSONB structure:
-- [
--   { "id": "A", "name": "Section A: Data Response", "questions": ["1a","1b","1c","1d"] },
--   { "id": "B", "name": "Section B: Essays", "questions": ["2","3"] }
-- ]

ALTER TABLE public.mock_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active mock papers"
  ON public.mock_papers FOR SELECT
  USING (active = true);

CREATE INDEX idx_mock_papers_product ON public.mock_papers(product_id);
CREATE INDEX idx_mock_papers_board_subject ON public.mock_papers(exam_board, subject);

-- 2. Mock results: stores completed exam attempts with per-question results
CREATE TABLE public.mock_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES public.mock_papers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  total_score INTEGER,
  max_score INTEGER NOT NULL,
  percentage NUMERIC(5,2),
  question_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'marking', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  tab_switches INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- question_results JSONB:
-- [
--   {
--     "question_number": "1a",
--     "marks_awarded": 3,
--     "marks_available": 4,
--     "feedback": "Good use of data...",
--     "level": "Level 2"
--   }
-- ]

-- answers JSONB:
-- { "1a": "Student answer text...", "1b": "..." }

ALTER TABLE public.mock_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own results"
  ON public.mock_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results"
  ON public.mock_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own results"
  ON public.mock_results FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_mock_results_user ON public.mock_results(user_id);
CREATE INDEX idx_mock_results_paper ON public.mock_results(paper_id);
CREATE INDEX idx_mock_results_user_paper ON public.mock_results(user_id, paper_id);

-- 3. Seed sample papers — Edexcel Economics Paper 1 2024 (structure only, no verbatim content)
INSERT INTO public.mock_papers (exam_board, subject, paper_number, paper_name, year, total_marks, time_limit_minutes, sections, questions)
VALUES
(
  'Edexcel', 'Economics', 1,
  'Edexcel Economics A Paper 1: Markets and Business Behaviour',
  2024, 80, 120,
  '[
    {"id": "A", "name": "Section A: Data Response (Q1-Q4)", "questions": ["1","2","3","4"]},
    {"id": "B", "name": "Section B: Essay Choice (Q5 or Q6)", "questions": ["5","6"]}
  ]'::jsonb,
  '[
    {"question_number": "1", "question_text": "With reference to Extract A, examine the factors that may have caused the change in the market described.", "marks_available": 5, "question_type": "5-marker", "section": "A"},
    {"question_number": "2", "question_text": "With reference to Extract B and your own knowledge, analyse the impact of the government intervention described on market outcomes.", "marks_available": 8, "question_type": "8-marker", "section": "A"},
    {"question_number": "3", "question_text": "With reference to the data provided, assess the extent to which the market failure identified can be corrected by government policy.", "marks_available": 10, "question_type": "10-marker", "section": "A"},
    {"question_number": "4", "question_text": "Evaluate the view that competition policy is the most effective method of improving consumer welfare in markets where firms have significant market power.", "marks_available": 12, "question_type": "12-marker", "section": "A"},
    {"question_number": "5", "question_text": "Evaluate the extent to which price discrimination benefits both firms and consumers. Use a diagram in your answer.", "marks_available": 25, "question_type": "25-marker", "section": "B", "diagram_required": true},
    {"question_number": "6", "question_text": "Evaluate the view that monopolies are always against the public interest. Use a diagram in your answer.", "marks_available": 25, "question_type": "25-marker", "section": "B", "diagram_required": true}
  ]'::jsonb
),
(
  'Edexcel', 'Economics', 2,
  'Edexcel Economics A Paper 2: The National and Global Economy',
  2024, 80, 120,
  '[
    {"id": "A", "name": "Section A: Data Response (Q1-Q4)", "questions": ["1","2","3","4"]},
    {"id": "B", "name": "Section B: Essay Choice (Q5 or Q6)", "questions": ["5","6"]}
  ]'::jsonb,
  '[
    {"question_number": "1", "question_text": "With reference to Extract A, examine the likely reasons for the macroeconomic trend described.", "marks_available": 5, "question_type": "5-marker", "section": "A"},
    {"question_number": "2", "question_text": "With reference to the data provided, analyse the possible effects of the policy change described on the UK economy.", "marks_available": 8, "question_type": "8-marker", "section": "A"},
    {"question_number": "3", "question_text": "With reference to the extracts and your own knowledge, assess the effectiveness of fiscal policy in achieving macroeconomic stability.", "marks_available": 10, "question_type": "10-marker", "section": "A"},
    {"question_number": "4", "question_text": "Evaluate the view that supply-side policies are more effective than demand-side policies in promoting long-run economic growth.", "marks_available": 12, "question_type": "12-marker", "section": "A"},
    {"question_number": "5", "question_text": "Evaluate the extent to which globalisation has benefited developing economies. Use a diagram in your answer.", "marks_available": 25, "question_type": "25-marker", "section": "B", "diagram_required": true},
    {"question_number": "6", "question_text": "Evaluate the view that a floating exchange rate is always preferable to a fixed exchange rate system. Use a diagram in your answer.", "marks_available": 25, "question_type": "25-marker", "section": "B", "diagram_required": true}
  ]'::jsonb
),
(
  'AQA', 'Economics', 1,
  'AQA Economics Paper 1: Markets and Market Failure',
  2024, 80, 120,
  '[
    {"id": "A", "name": "Section A: Data Response (Q1)", "questions": ["1a","1b","1c","1d"]},
    {"id": "B", "name": "Section B: Essay Choice (Q2 or Q3)", "questions": ["2","3"]}
  ]'::jsonb,
  '[
    {"question_number": "1a", "question_text": "Using the data in Extract A, calculate the percentage change described and explain its significance.", "marks_available": 4, "question_type": "4-marker", "section": "A"},
    {"question_number": "1b", "question_text": "Explain, using a diagram, how the change described in Extract B would affect the market.", "marks_available": 9, "question_type": "9-marker", "section": "A", "diagram_required": true},
    {"question_number": "1c", "question_text": "Using the data in the extracts and your own economic knowledge, evaluate the likely impact of the government intervention described.", "marks_available": 15, "question_type": "15-marker", "section": "A"},
    {"question_number": "1d", "question_text": "Using the data in the extracts and your own economic knowledge, evaluate the extent to which the market failure identified justifies government intervention.", "marks_available": 25, "question_type": "25-marker", "section": "A"},
    {"question_number": "2", "question_text": "Evaluate the view that indirect taxes are the most effective way to correct negative externalities.", "marks_available": 25, "question_type": "25-marker", "section": "B"},
    {"question_number": "3", "question_text": "Evaluate the view that contestable markets always lead to better outcomes for consumers than monopoly markets.", "marks_available": 25, "question_type": "25-marker", "section": "B"}
  ]'::jsonb
);

-- Link papers to products where possible
UPDATE public.mock_papers
SET product_id = (SELECT id FROM public.products WHERE slug = 'edexcel-economics' LIMIT 1)
WHERE exam_board = 'Edexcel' AND subject = 'Economics' AND product_id IS NULL;

UPDATE public.mock_papers
SET product_id = (SELECT id FROM public.products WHERE slug = 'aqa-economics' LIMIT 1)
WHERE exam_board = 'AQA' AND subject = 'Economics' AND product_id IS NULL;
