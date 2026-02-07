

## Backend Cleanup: Unified Deluxe Model for All Users

### What Changes

Everyone (paying and non-paying) will use the same deluxe AI model, deluxe system prompt, and full training data. The only difference between paying and non-paying users will be **usage limits** (3 prompts/day for free, unlimited for paid) and feature restrictions (to be decided later).

### Step-by-Step Plan

#### 1. Database Cleanup (Products Table)

- Set `system_prompt_free` to `NULL` for all products that currently have one (AQA Economics, AQA Psychology, AQA Chemistry, OCR Physics)
- Set `chatbase_free_url` to `NULL` for all products (legacy Chatbase free URLs are no longer needed)
- The `system_prompt_free` column itself can remain in the schema (harmless) to avoid a destructive migration

#### 2. Database Cleanup (Document Chunks)

- Update all `document_chunks` where `metadata->>'tier' = 'free'` to set tier to `NULL` (or remove the tier key)
- This removes the content access distinction -- all training data is now accessible to everyone
- 436 "free" chunks + 26 null chunks will become universally available alongside the 221 "deluxe" chunks

#### 3. Edge Function: `rag-chat` (Main Changes)

**System Prompt Selection** -- Always use `system_prompt_deluxe`:
- Remove the tier parameter from `fetchSystemPrompt()`
- Always query `system_prompt_deluxe` column, never `system_prompt_free`

**Training Data Retrieval** -- Remove tier filtering:
- Remove the `if (tier === 'free')` block in `fetchRelevantContext()` that restricts free users to only free-tier chunks
- All users get the full training data context regardless of subscription status

**Keep prompt limiting logic unchanged:**
- The daily 3-prompt limit for non-subscribers stays exactly as-is
- The `tier` parameter is still sent from frontend and used ONLY for the prompt limit check (`checkAndIncrementUsage`)

#### 4. Edge Function: `get-chatbot-url` (Legacy Cleanup)

- Remove all free Chatbase URLs from the `CHATBOT_URLS` mapping
- This function is largely legacy (RAGChat has replaced Chatbase), but clean it up for consistency
- Remove the `if (tier === 'free')` early return that skips auth checks

#### 5. No Frontend Design Changes

The frontend pages already pass `tier="deluxe"` to the RAGChat component. No UI changes needed -- this is purely a backend cleanup.

---

### Technical Details

**Files modified:**

| File | Change |
|------|--------|
| `supabase/functions/rag-chat/index.ts` | Always use `system_prompt_deluxe`; remove tier filtering on document_chunks retrieval |
| `supabase/functions/get-chatbot-url/index.ts` | Remove free Chatbase URLs and free-tier early return |

**Database operations (via data update, not schema migration):**

```sql
-- Clear free system prompts (no longer used)
UPDATE products SET system_prompt_free = NULL;

-- Clear legacy Chatbase free URLs
UPDATE products SET chatbase_free_url = NULL;

-- Remove tier distinction from training data chunks
UPDATE document_chunks
SET metadata = metadata - 'tier'
WHERE metadata->>'tier' IS NOT NULL;
```

**Key behavior after changes:**

```text
Non-paying user sends message:
  1. Check daily usage -> if under 3, allow
  2. Fetch system_prompt_deluxe from products table
  3. Retrieve ALL training data (no tier filter)
  4. Generate response with full deluxe model

Paying user sends message:
  1. Skip usage check (unlimited)
  2. Fetch system_prompt_deluxe from products table
  3. Retrieve ALL training data (no tier filter)
  4. Generate response with full deluxe model
```

The only remaining difference is the 3-prompt daily cap for non-subscribers, plus any future feature restrictions you decide on later.

