

## My Mistakes -- Spaced Repetition Feature

### Overview
Add a "My Mistakes" tool to all maths chatbots (Edexcel Pure, Edexcel Applied) and OCR CS, plus make it available in the Build portal for dynamic subjects. Users can log questions they got wrong (image or text), add notes, and get reminded to retry them on a spaced repetition schedule (day 4, 16, 35, 70). A red notification badge shows how many are due for review.

---

### 1. Database Table

Create a `user_mistakes` table:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL |
| product_id | uuid | NOT NULL |
| question_text | text | nullable (user may upload image only) |
| question_image_url | text | nullable (base64 data URL stored directly) |
| note | text | nullable |
| created_at | timestamptz | default now() |
| next_review_at | timestamptz | default now() + interval '4 days' |
| review_count | integer | default 0 |
| completed | boolean | default false |

RLS policies:
- Users can SELECT, INSERT, UPDATE, DELETE their own rows (`auth.uid() = user_id`)

The spaced repetition intervals are: review_count 0 = day 4, 1 = day 16, 2 = day 35, 3 = day 70, 4+ = completed.

---

### 2. New Component: `MyMistakesTool.tsx`

Follows the exact same pattern as RevisionGuideTool, ExamCountdown, etc. (header with icon + gradient box, content area).

**Two views:**

**A) Add Mistake View (default)**
- Upload area for an image (same drag/drop pattern as ImageUploadTool) OR text input for typing the question
- Text area for a note ("What did I get wrong?")
- "Save Mistake" button

**B) My Mistakes List View**
- Toggle between "Add" and "View All" tabs
- Lists all saved mistakes (newest first), each showing:
  - Question preview (thumbnail if image, text snippet if text)
  - Note
  - Next review date or "Due now" badge
  - "Mark as Reviewed" button (advances to next interval)
  - Delete option

**Notification count:** Computed client-side by counting rows where `next_review_at <= now()` and `completed = false`.

---

### 3. Header Integration

- Add new props to Header: `showMyMistakes?: boolean`
- Add state: `myMistakesOpen`
- Add Popover between Revision Guide and Exam Countdown
- Icon: `AlertCircle` or `RotateCcw` from lucide-react
- Button label: "My Mistakes"
- Red notification badge: small absolute-positioned circle with count, only shown when due count > 0
- Requires `productId` and user auth to query/insert

---

### 4. Pages to Update

Add `showMyMistakes` prop to Header in these pages:
- `EdexcelMathsFreeVersionPage.tsx`
- `EdexcelMathsPremiumPage.tsx`
- `EdexcelMathsAppliedFreeVersionPage.tsx`
- `EdexcelMathsAppliedPremiumPage.tsx`
- `OCRCSFreeVersionPage.tsx`
- `OCRCSPremiumPage.tsx`

---

### 5. Build Portal Integration

Add to the `WEBSITE_FEATURES` array in `BuildPage.tsx`:
```
{ id: "my_mistakes", label: "My Mistakes", description: "Spaced repetition tracker for questions students got wrong", icon: RotateCcw }
```

Add to `DynamicFreePage.tsx` and `DynamicPremiumPage.tsx`:
```
showMyMistakes={hasFeature('my_mistakes')}
```

---

### 6. Files Changed

| File | Change |
|------|--------|
| New migration | Create `user_mistakes` table + RLS |
| `src/components/MyMistakesTool.tsx` | **New file** -- full component |
| `src/components/Header.tsx` | Add `showMyMistakes` prop, popover, notification badge |
| `src/pages/EdexcelMathsFreeVersionPage.tsx` | Add `showMyMistakes` |
| `src/pages/EdexcelMathsPremiumPage.tsx` | Add `showMyMistakes` |
| `src/pages/EdexcelMathsAppliedFreeVersionPage.tsx` | Add `showMyMistakes` |
| `src/pages/EdexcelMathsAppliedPremiumPage.tsx` | Add `showMyMistakes` |
| `src/pages/OCRCSFreeVersionPage.tsx` | Add `showMyMistakes` |
| `src/pages/OCRCSPremiumPage.tsx` | Add `showMyMistakes` |
| `src/pages/BuildPage.tsx` | Add to WEBSITE_FEATURES |
| `src/pages/DynamicFreePage.tsx` | Wire up `showMyMistakes` |
| `src/pages/DynamicPremiumPage.tsx` | Wire up `showMyMistakes` |

