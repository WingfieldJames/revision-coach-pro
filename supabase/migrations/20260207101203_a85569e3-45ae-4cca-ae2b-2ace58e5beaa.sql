-- Step 1: Clear free system prompts (no longer used - everyone uses deluxe)
UPDATE products SET system_prompt_free = NULL;

-- Step 2: Clear legacy Chatbase free URLs (no longer needed)
UPDATE products SET chatbase_free_url = NULL;

-- Step 3: Remove tier distinction from training data chunks
-- This makes ALL training data accessible to everyone
UPDATE document_chunks
SET metadata = metadata - 'tier'
WHERE metadata->>'tier' IS NOT NULL;