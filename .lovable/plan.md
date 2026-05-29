## Diagnosis

The cancel **edge function** is fine. The cancel **button is invisible** for a chunk of paying monthly subscribers.

Both `src/components/ProfileContent.tsx` and `src/pages/DashboardPage.tsx` build the list of subscriptions to render from a **hardcoded `boardNames` map of 8 subject keys** (edexcel, aqa, cie, ocr-cs, ocr-physics, aqa-chemistry, aqa-psychology, edexcel-maths). They call `checkProductAccess` only for those 8 slugs and only render rows for them.

Any user whose monthly subscription is on a different product — i.e. anything added via the Build portal or any other dynamic subject — sees **no subscription row at all**, and therefore no Manage/Cancel button. They have no in-app way to cancel and have to email us.

Diego (the screenshot) is on `ocr-economics`. Confirmed via DB:

```
tornero.diegoj@gmail.com → ocr-economics, monthly, active, cancelled_at NULL
```

`ocr-economics` is not in the hardcoded map, so his profile shows nothing to cancel.

Active monthly subscribers on subjects missing from the hardcoded list (so all currently locked out of self-serve cancel):

```
ocr-economics              17
aqa-physics                 8
edexcel-politics            5
aqa-computer-science        2
edexcel-mathematics-applied 1
aqa-geography               1
aqa-mathematics             1
aqa-biology                 1
ocr-maths                   1
edexcel-igcse-chemistry     1
                           --
total                      ~38
```

Also matches the project rule "Read the live subject list from the products table, not from any hardcoded array."

`cancel-subscription` edge function logs are empty for these users because the request is never fired — pure UI gap, not a backend bug.

## Fix

Drive the subscription list from the actual `user_subscriptions` rows we already fetch, not from a static slug map. The cancel function already accepts `subscriptionId` and works for any product.

### 1. `src/components/ProfileContent.tsx`

- Replace the 8-slug `Promise.all(checkProductAccess(...))` block and the parallel `boardNames` map with a single fetch of all active subs:
  ```ts
  supabase
    .from('user_subscriptions')
    .select('*, products(name, slug)')
    .eq('user_id', user.id)
    .eq('active', true);
  ```
- Store the array in state (e.g. `activeSubs`).
- Render one row per row in `activeSubs`, using `sub.products.name` for the label and `sub.products.slug` as the row key.
- Keep the existing render logic: Monthly/Lifetime/Referral/School badge, `cancelled_at` "Cancelling" badge, renews/expires date, and the Manage button gated on `isMonthly && payment_type !== 'school' && !cancelled_at`.
- `startCancelFlow` / `confirmCancellation` keep working — pass the sub directly (or its `id`) instead of looking it up by board key. Already calls `cancel-subscription` with `subscriptionId: sub.id`, which is product-agnostic.
- Drop the `productAccess` state and `checkProductAccess` calls from this component — Profile no longer needs per-product access checks, only the actual sub list. (Other components that legitimately need `checkProductAccess` are untouched.)
- School license block stays as-is.

### 2. `src/pages/DashboardPage.tsx`

Same shape of fix in the Subscriptions card (around lines 600–690):

- Replace the hardcoded `boardNames` iteration and the long `!productAccess['edexcel']?.hasAccess && …` "Free" condition with iteration over the fetched active subs.
- Display name from `sub.products.name` (append " Deluxe" to preserve current copy).
- "Free" pill shows when the user has zero active subs.
- Cancel button calls existing `handleCancelSubscription`; update it to take the sub object (or `subscriptionId`) and forward `subscriptionId` in the edge-function body so it targets the right row when a user has multiple subs.

### 3. Out of scope (flagging, not fixing in this pass)

- `cancel-subscription` edge function — unchanged. It already handles `subscriptionId` correctly.
- `productAccess.ts` — sacred file, not touched.
- RLS, migrations, Stripe webhook — not touched.
- For Diego specifically: once this ships he can self-serve. Separately, worth replying to his email and offering to cancel server-side; that's an ops action, not a code change.

## Risk

- Low. UI-only change in two files. No billing, auth, RLS, or migrations.
- The fetch already exists in `ProfileContent` (`subscriptionDetails`), so we're consolidating, not adding a new query.
- Visual regression risk for the existing 8 supported subjects: row text changes from the hardcoded `boardNames` value to `products.name`. I'll spot-check that `products.name` reads correctly (e.g. "Edexcel Economics" vs "Edexcel A-Level Economics") and, if there's a mismatch, keep a small slug→display override only where the DB name is wrong — not as the source of truth.

## Verification

- Log in as a test user with an `ocr-economics` monthly sub → Profile shows the row and a working Manage button → cancel flow completes → row flips to "Cancelling".
- Existing 8-subject users still see their row with correct name, badge, and Cancel button.
- Users with zero subs still see "No active subscriptions" / "Free".
