

# Adding Edexcel Mathematics Chatbot

## Overview
Add a full Edexcel Mathematics A-Level chatbot product to the platform, following the exact same architecture pattern used for OCR Physics. Tudor is the brain behind Edexcel Maths (he scored 236/240 in A-Level Mathematics). The chatbot page removes the 6-marker analysis feature but keeps the Upgrade Now button and all other standard tools. Stripe checkout is set up at the same pricing as all other subjects.

---

## Step 1: Create Database Product Row

Insert a new product into the `products` table for Edexcel Mathematics with:
- **Name**: Edexcel Mathematics Deluxe
- **Slug**: `edexcel-mathematics`
- **Subject**: `mathematics`
- **Exam board**: `edexcel`
- **Monthly price**: 699 (same as all others)
- **Lifetime price**: 2499 (same as all others)
- **system_prompt_deluxe**: A Maths-specific tutoring persona for Tudor, covering Edexcel specification content, past papers, and exam technique

The system prompt will follow the established pattern but tailored for Maths: specification-linked responses, step-by-step working, mark scheme awareness, and exam technique for Edexcel Maths (9MA0).

---

## Step 2: Create Chatbot Pages

### 2a. Free Version Page (`src/pages/EdexcelMathsFreeVersionPage.tsx`)
Modelled exactly on `OCRPhysicsFreeVersionPage.tsx`:
- Uses `RAGChat` component with Edexcel Maths product ID
- Header with: My AI, Past Paper Finder, Exam Countdown, Upgrade Now button
- **No** Essay Marker / 6-Marker Analysis
- **No** Diagram Generator
- Suggested prompts tailored to Edexcel Maths (e.g. "Explain integration by parts", "How do I approach a proof question?", "Find past exam questions on differentiation", "Create me a full revision plan")

### 2b. Premium Page (`src/pages/EdexcelMathsPremiumPage.tsx`)
Modelled exactly on `OCRPhysicsPremiumPage.tsx`:
- Full access check against `edexcel-mathematics` product slug
- Same loading/auth/no-access states
- Header with: My AI, Past Paper Finder, Exam Countdown, Upgrade Now / Deluxe badge
- **No** Essay Marker / 6-Marker Analysis
- **No** Diagram Generator

---

## Step 3: Add Exam Dates

In `src/components/ExamCountdown.tsx`, add `EDEXCEL_MATHS_EXAMS`:
- Paper 1 (Pure Mathematics): June 2, 2026
- Paper 2 (Pure Mathematics): June 9, 2026  
- Paper 3 (Statistics and Mechanics): June 15, 2026

*(Dates based on typical Edexcel A-Level Maths 9MA0 timetable -- these can be adjusted when the exact 2026 timetable is confirmed)*

---

## Step 4: Register Routes in App.tsx

Add imports and routes:
- `/edexcel-maths-free-version` -> `EdexcelMathsFreeVersionPage`
- `/edexcel-maths-premium` -> `EdexcelMathsPremiumPage`

---

## Step 5: Add "Mathematics" to Subject Toggles

### Files affected:
- `src/pages/ComparePage.tsx`
- `src/components/SubjectPlanSelector.tsx` (HomePage widget)
- `src/pages/DashboardPage.tsx`

### Changes:
1. Add `'mathematics'` to the `Subject` type union in each file
2. Add to `subjectLabels`: `mathematics: 'Mathematics'`
3. Add to `PRODUCT_IDS`: `'edexcel-mathematics': '<new-product-id>'`
4. Update `getCurrentProductSlug()` to return `'edexcel-mathematics'` when subject is `mathematics`
5. Add `'mathematics'` to the subject toggle arrays (both mobile dropdown and desktop toggle group)
6. Maths board selector: Only **Edexcel** is active; **OCR** and **AQA** are greyed out (same pattern used for CS/Physics where only one board is active)
7. Set fixed width for the "Mathematics" toggle button: `w-[120px]` (consistent with the fixed-width system)

### Navigation mappings:
- Free path: `/edexcel-maths-free-version`
- Premium path: `/edexcel-maths-premium`

---

## Step 6: Update "The Plan" Feature List for Mathematics

When `subject === 'mathematics'` is selected on the Compare page and SubjectPlanSelector, the plan description shows:

1. AI trained on all past papers and mark schemes
2. Full A* exam technique + essay structures
3. Diagram Generator
4. Past Paper Finder (2,000+ questions)
5. Image upload and Edexcel analysis
6. Covers entire Edexcel specification
7. Personalised revision plans

The "Image upload and OCR analysis" bullet dynamically shows "Edexcel analysis" when Maths is selected (matching the existing pattern for other subjects). The "Covers entire X specification" bullet shows "Edexcel".

---

## Step 7: Update Founder Section (Compare Page)

### `src/components/ui/founder-section.tsx`
Add `mathematics` to the `FounderSectionProps` subject union type and add Tudor's Maths-specific content:
- **Photo**: Tudor (same asset already imported)
- **Achievements**: A*A*A*A* at A-Level, 236/240 in A-Level Mathematics, Straight 9s at GCSE
- **Quote**: Tudor's Maths-specific quote about building the model on techniques that got him near-perfect marks in Edexcel Maths

Also ensure the FounderSection renders for `subject === 'mathematics'` on both mobile and desktop views of the Compare page.

---

## Step 8: Update Dashboard Page

In `src/pages/DashboardPage.tsx`:
- Add `'mathematics'` to the subject dropdown
- When `mathematics` is selected, show Edexcel as the locked board (same as Physics showing OCR)
- Add `'edexcel-mathematics'` to product access checks
- Map slug `edexcel-mathematics` to UI key `edexcel-maths`
- Add navigation links: free -> `/edexcel-maths-free-version`, premium -> `/edexcel-maths-premium`
- Add subscription status display for "Edexcel Mathematics Deluxe"
- Subject-specific descriptions: "AI trained on all Edexcel Mathematics past papers"

---

## Step 9: Update LatestFeaturesSection

In `src/components/LatestFeaturesSection.tsx`:
- Add `'mathematics'` to the subject prop type
- Use the general economics-style features (Diagram Generator, Past Papers, Essay Marker) or create maths-specific variants

---

## Step 10: Update HomePage Subject Rotation

The hero section in `HomePage.tsx` already includes 'Maths' in the rotating subject list (line 97), so no change needed there.

---

## Step 11: Update FAQ

In the "What subjects do you cover?" FAQ on the HomePage, add "Mathematics (Edexcel)" to the list.

---

## Technical Notes

- **Stripe checkout**: No Stripe product/price creation is needed upfront. The `create-checkout` function dynamically creates price data using `price_data` inline (not pre-created Stripe Price IDs). It pulls `monthly_price` (699) and `lifetime_price` (2499) from the products table. The stripe-webhook handles subscription creation automatically.
- **RAG data**: The chatbot will work immediately via the system prompt, but will have limited RAG context until Edexcel Maths past papers and specifications are ingested into `document_chunks`. This is a separate data ingestion step that can happen later.
- **Usage limits**: Free users get 3 prompts/day (enforced server-side in `rag-chat`). Same as all other subjects.
- **No code changes needed** in `rag-chat` edge function -- it's fully database-driven and will automatically pick up the new product.

