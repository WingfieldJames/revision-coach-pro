
# Plan: Fix RAG System Modularity and Tier Isolation

## Overview
Refactor the RAG retrieval system to ensure complete isolation between subjects/boards and proper tier-based content access. Each subject-board combination will have its own isolated "section" in the database with clear free/deluxe tier separation.

## Current Architecture Issues

| Issue | Impact | Priority |
|-------|--------|----------|
| No tier filtering in retrieval | Free users can see deluxe content | Critical |
| Inconsistent tier metadata | Some products lack tier markers | High |
| Basic retrieval (no routing) | Doesn't follow system prompt instructions | Medium |

## Implementation Plan

### Phase 1: Fix Tier-Based Retrieval (Critical)

**File: `supabase/functions/rag-chat/index.ts`**

Update `fetchRelevantContext()` to filter by tier:

```text
Current behavior:
  Query: product_id = X → Returns ALL chunks for that product

New behavior:
  Free tier: product_id = X AND (tier = 'free' OR tier IS NULL)
  Deluxe tier: product_id = X (gets everything - free + deluxe)
```

Technical changes:
- Add `tier` parameter to `fetchRelevantContext()`
- Apply tier filter in the Supabase query
- Maintain backwards compatibility for products without tier metadata (treat NULL as "free")

### Phase 2: Standardize Database Metadata

Update existing document_chunks to have consistent tier metadata:

| Product | Current State | Action |
|---------|--------------|--------|
| OCR Physics | Has tier markers | No change needed |
| OCR CS | All NULL tier | Mark all as `tier: 'free'` (spec is same for both tiers) |
| Edexcel Economics | All NULL tier | Mark all as `tier: 'free'` |
| AQA Economics | All NULL tier | Mark all as `tier: 'free'` |

Database migration to set default tier for existing data.

### Phase 3: Add Smart Content Routing (Enhancement)

The system prompt says to route to different content types based on question type. Add basic content-type routing:

```text
User asks about exam technique → Prioritize content_type: 'exam_technique'
User asks for definition → Prioritize content_type: 'specification'
User asks for practice question → Prioritize content_type: 'past_paper'
```

Add keyword detection in the edge function to select appropriate `content_type` filters.

## Data Organization Structure (Post-Implementation)

```text
document_chunks table
├── OCR Physics (product_id: ecd5978d...)
│   ├── Free Tier (tier: 'free')
│   │   ├── specification (Modules 1-6)
│   │   └── past_paper (2024 Paper 1)
│   └── Deluxe Tier (tier: 'deluxe')
│       ├── specification (same + additional detail)
│       ├── past_paper (all years)
│       ├── mark_scheme
│       └── exam_technique
│
├── OCR Computer Science (product_id: 5d05830b...)
│   ├── Free Tier
│   │   └── specification
│   └── Deluxe Tier
│       └── (future: mark schemes, past papers)
│
├── Edexcel Economics (product_id: 6dc19d53...)
│   ├── Free Tier
│   │   └── specification
│   └── Deluxe Tier
│       └── exam_technique
│
└── AQA Economics (product_id: 17ade690...)
    ├── Free Tier
    │   └── specification
    └── Deluxe Tier
        └── past papers (Paper 1, Paper 2)
```

## Technical Implementation Details

### Edge Function Changes

```typescript
// Updated fetchRelevantContext signature
async function fetchRelevantContext(
  supabase,
  productId: string,
  userMessage: string,
  tier: 'free' | 'deluxe',  // NEW: tier parameter
  contentTypes?: string[]
): Promise<FetchContextResult>

// Updated query logic
let query = supabase
  .from('document_chunks')
  .select('content, metadata')
  .eq('product_id', productId);

// Apply tier filter for free users
if (tier === 'free') {
  // Get only free content (or content with no tier for backwards compat)
  query = query.or('metadata->tier.eq.free,metadata->tier.is.null');
}
// Deluxe users get everything (no additional filter)
```

### Database Migration

```sql
-- Set default tier for products without tier metadata
UPDATE document_chunks 
SET metadata = metadata || '{"tier": "free"}'
WHERE metadata->>'tier' IS NULL;
```

## Testing Checklist

After implementation:
- [ ] OCR Physics free chatbot returns only free-tier content
- [ ] OCR Physics deluxe chatbot returns both free + deluxe content
- [ ] No cross-contamination between products (e.g., CS content in Physics chat)
- [ ] Backwards compatibility maintained for products with NULL tier

## Files to Modify

1. `supabase/functions/rag-chat/index.ts` - Add tier filtering
2. Database migration - Standardize tier metadata
3. No frontend changes required (RAGChat already passes `tier` prop)
