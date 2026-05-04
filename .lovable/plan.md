## Plan

### 1. Grant Aleisha OCR Maths Deluxe (data migration)
Insert a complimentary lifetime Deluxe subscription on `user_subscriptions` for `aleishadhalla@gmail.com` (`1485c772-ac3c-4c89-acff-3bb03fabb712`) against the OCR Mathematics product (`d5859e4a-4a7f-4c46-ad62-24b01605947b`). Leave the existing Edexcel Economics row in place as a goodwill extra.

### 2. Harden `create-checkout` to prevent silent product mis-selection
In `supabase/functions/create-checkout/index.ts`, remove the `edexcel-economics` fallback when neither `productId` nor `productSlug` is supplied. Return `400 product_required` instead. This was the root cause of Aleisha's wrong subscription — she was logged into OCR Maths but the legacy `/compare` upgrade button sent no product context, so the function defaulted to Edexcel Economics.

Mirror the same change in `stripe-webhook/index.ts` `resolveProductId` — drop the `edexcel-economics` last-resort fallback so any future ambiguous session fails loudly instead of being assigned to the wrong product.

### 3. Audit upgrade CTAs for product context
Search every "Upgrade to Deluxe" call site (premium pages, `SubjectPlanSelector`, dynamic premium page, GCSE compare) to confirm each one passes `productSlug` (or `productId`) derived from the current bot. Patch any that don't.

### 4. Verify
- Re-query `user_subscriptions` to confirm Aleisha's OCR Maths row is active.
- Confirm `create-checkout` returns 400 when called without product info.