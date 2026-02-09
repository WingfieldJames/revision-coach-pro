

## Sync SubjectPlanSelector with ComparePage

Bring all the ComparePage improvements into the `SubjectPlanSelector` component used on the homepage.

### Changes (single file: `src/components/SubjectPlanSelector.tsx`)

#### 1. Replace toggle-based selectors with dropdown buttons
Remove the desktop toggle group and mobile toggle/dropdown hybrid. Replace with two simple dropdown buttons matching ComparePage:
- Subject dropdown: purple gradient pill (`bg-gradient-brand text-white glow-brand`)
- Exam board dropdown: bordered pill (`border border-border bg-background`)
- Board options are dynamically filtered by subject (Economics gets Edexcel/AQA/CIE, others are locked)
- Labels use explicit "AQA", "OCR", "CIE" capitalization

#### 2. Add Deluxe subscription detection
- Add `subscriptionPaymentType` state
- Update the `checkProductAccess` call to also capture `subscription?.payment_type`
- When user has access:
  - Title changes from "The Plan" to "You're Deluxe!"
  - Subtitle changes to "You have access to:"
  - CTA button changes to "Go to your chat ->" and routes to the premium chatbot
  - Footer shows "Monthly pass active" or "Exam season pass active"

#### 3. Add premium click handler
- Import and replicate the `handlePremiumClick` logic from ComparePage (routes to premium path if access exists, otherwise creates checkout)
- Update CTA to call `handlePremiumClick` when user has access, `handleFreeClick` otherwise

#### 4. Remove unused imports
- Remove `ToggleGroup` and `ToggleGroupItem` imports since we're switching to dropdowns only

### Technical details

The entire selector section (lines 159-337) will be restructured to match ComparePage lines 231-352, using the same two-dropdown layout, same plan card with conditional deluxe content, and same CTA logic.
