

# Plan: Add AQA Chemistry (Free & Deluxe)

## Summary

This plan adds a new subject **AQA Chemistry** to the platform with both Free and Deluxe chatbot versions, following the exact format of the OCR Physics pages. Tudor will be the "brain behind" AQA Chemistry. The subject will be added to the pricing page toggle system with AQA, Edexcel, and OCR as exam board options (only AQA functional initially).

---

## Database Changes

### Insert New Product: AQA Chemistry

Insert a new row into the `products` table:

| Field | Value |
|-------|-------|
| name | AQA Chemistry |
| slug | aqa-chemistry |
| subject | Chemistry |
| exam_board | AQA |
| monthly_price | 499 (£4.99) |
| lifetime_price | 2499 (£24.99) |
| active | true |
| system_prompt_free | (to be added later with training data) |
| system_prompt_deluxe | (to be added later with training data) |

Note: There is already an "OCR Chemistry" product in the database. This plan creates a separate "AQA Chemistry" product.

---

## New Files

### 1. `src/pages/AQAChemistryFreeVersionPage.tsx`

A new page following the exact format of `OCRPhysicsFreeVersionPage.tsx`:
- Uses `RAGChat` component with `tier="free"`
- Imports `AQA_CHEMISTRY_EXAMS` for exam countdown
- Product ID will be fetched from the database using slug `aqa-chemistry`
- Header includes: Image Tool, Essay Marker (locked), Past Paper Finder, Exam Countdown
- No Diagram Generator tool
- Uses the same layout and description style as OCR Physics

### 2. `src/pages/AQAChemistryPremiumPage.tsx`

A new premium page following the exact format of `OCRPhysicsPremiumPage.tsx`:
- Uses `RAGChat` component (no tier restriction)
- Access check using `checkProductAccess` for `aqa-chemistry` slug
- Header includes: Image Tool, Essay Marker (unlocked), Past Paper Finder, Exam Countdown
- Same loading states and access denied UI as OCR Physics

---

## File Modifications

### 1. `src/components/ExamCountdown.tsx`

Add AQA Chemistry exam dates (2026 dates based on typical AQA Chemistry schedule):

```typescript
export const AQA_CHEMISTRY_EXAMS: ExamDate[] = [
  { name: "Paper 1 (Inorganic & Physical)", date: new Date(2026, 4, 13), description: "Inorganic and Physical Chemistry" },
  { name: "Paper 2 (Organic & Physical)", date: new Date(2026, 4, 20), description: "Organic and Physical Chemistry" },
  { name: "Paper 3 (Practical)", date: new Date(2026, 5, 10), description: "Practical Chemistry" },
];
```

### 2. `src/components/ui/founder-section.tsx`

Update to support Chemistry as a subject with Tudor as the founder:

- Add `chemistry` to the subject type
- Add `isChemistry` condition that shows Tudor's photo and achievements
- Add chemistry-specific achievements (same as Physics since Tudor leads both)
- Add chemistry-specific quote for Tudor

### 3. `src/pages/ComparePage.tsx`

Update the toggle system to include Chemistry:

**Changes to Subject Toggle:**
- Add `chemistry` to the `Subject` type: `'economics' | 'computer-science' | 'physics' | 'chemistry'`
- Add Chemistry toggle option in both mobile dropdown and desktop toggle group
- Chemistry label: "Chemistry"
- Fixed width for toggle button: ~100px

**Changes to Exam Board Logic:**
- When Chemistry is selected, show AQA, Edexcel, OCR as options (similar to Physics)
- Only AQA is functional; Edexcel and OCR shown as disabled/greyed out

**Changes to Product Slug Logic:**
Update `getCurrentProductSlug()`:
```typescript
if (subject === 'chemistry') return 'aqa-chemistry';
```

**Changes to PRODUCT_IDS:**
Add: `'aqa-chemistry': '<product_id_from_database>'`

**Changes to Free Click Handler:**
```typescript
if (subject === 'chemistry') return '/aqa-chemistry-free-version';
```

**Changes to Premium Click Handler:**
```typescript
if (subject === 'chemistry') return '/aqa-chemistry-premium';
```

**Changes to subjectLabels:**
```typescript
'chemistry': 'Chemistry'
```

### 4. `src/App.tsx`

Add routes for the new Chemistry pages:

```typescript
import { AQAChemistryFreeVersionPage } from "./pages/AQAChemistryFreeVersionPage";
import { AQAChemistryPremiumPage } from "./pages/AQAChemistryPremiumPage";

// In Routes:
<Route path="/aqa-chemistry-free-version" element={<AQAChemistryFreeVersionPage />} />
<Route path="/aqa-chemistry-premium" element={<AQAChemistryPremiumPage />} />
```

### 5. `src/pages/DashboardPage.tsx`

Add Chemistry to the dashboard product access checks:

- Add `chemistry` to Subject type
- Add `aqa-chemistry` to the access check list
- Add Chemistry subject toggle option
- Update the subscription mapping for `aqa-chemistry`

---

## Stripe Integration

The `create-checkout` edge function already supports dynamic product pricing. Once the product is added to the database, Stripe checkout will automatically:

1. Look up the product by ID from the PRODUCT_IDS mapping
2. Use the `monthly_price` (499 = £4.99) or `lifetime_price` (2499 = £24.99) from the database
3. Create a Stripe checkout session with the correct pricing
4. Handle both monthly subscription and Exam Season Pass flows

No changes to the edge function are required - it already handles new products dynamically.

---

## Technical Details

### Founder Section Updates for Chemistry

```typescript
// In founder-section.tsx
const isChemistry = subject === 'chemistry';

const chemistryAchievements = [
  { icon: Award, text: "A*A*A*A* at A-Level" },
  { icon: Trophy, text: "197/200 in A-Level Chemistry" },
  { icon: GraduationCap, text: "Straight 9s at GCSE" },
];

// Tudor's chemistry quote
{isChemistry && (
  "Hi, I'm Tudor. 4 A* grades at A-Level including 197/200 in Chemistry. 
  Through A* AI Chemistry, you'll gain access to the exact revision strategies 
  that drove my Chemistry results, alongside laser-focused exam technique 
  for every question type and exclusive AQA-specific training."
)}
```

### Compare Page Toggle Layout (Desktop)

```text
[Economics] [Computer Science] [Physics] [Chemistry] | [AQA] [Edexcel (grey)] [OCR (grey)]
```

When Chemistry is selected, only AQA is clickable; Edexcel and OCR are shown but disabled.

---

## Files Summary

| Action | File |
|--------|------|
| CREATE | `src/pages/AQAChemistryFreeVersionPage.tsx` |
| CREATE | `src/pages/AQAChemistryPremiumPage.tsx` |
| MODIFY | `src/components/ExamCountdown.tsx` |
| MODIFY | `src/components/ui/founder-section.tsx` |
| MODIFY | `src/pages/ComparePage.tsx` |
| MODIFY | `src/App.tsx` |
| MODIFY | `src/pages/DashboardPage.tsx` |
| DB MIGRATION | Insert AQA Chemistry product |

---

## Post-Implementation Notes

1. **Training Data**: The chatbots will work but will need RAG training data (specification, past papers, mark schemes) to be ingested separately
2. **System Prompts**: The `system_prompt_free` and `system_prompt_deluxe` columns can be updated in the database once the AI persona is finalized
3. **Testing**: After implementation, test the full flow:
   - Visit /compare and select Chemistry
   - Click Free to access /aqa-chemistry-free-version
   - Test checkout flow for monthly and Exam Season Pass
   - Verify access control on premium page

