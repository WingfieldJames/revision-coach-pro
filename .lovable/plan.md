

## Plan: Premium UI & Redirect Fix on Compare Page

### Problem
1. The plan card always shows "The Plan" with "Get Started" regardless of subscription status.
2. Clicking "Get Started" always redirects to the free chatbot, even for premium users.

### Changes

All changes are in **`src/pages/ComparePage.tsx`**:

#### 1. Store subscription details (not just a boolean)

Currently, the access check only saves `hasProductAccess` (true/false). We need to also store the `payment_type` from the subscription so we can display the correct status text.

- Add a new state variable `subscriptionPaymentType` (type: `string | null`)
- In the `checkAccess` effect, save `access.subscription?.payment_type` alongside `hasProductAccess`

#### 2. Conditionally render the plan card for premium users

When `hasProductAccess` is true, the plan card will show:
- **Title**: "You're Deluxe!" instead of "The Plan"
- **Subtitle**: "You have access to:" instead of "Everything you need to ace your X exam"
- **Button text**: "Go to your chat" with arrow, instead of "Get Started"
- **Footer text**: "Monthly pass active" or "Exam season pass active" based on `subscriptionPaymentType` (monthly = "Monthly pass active", lifetime = "Exam season pass active")

#### 3. Fix the button click handler

Currently the button calls `handleFreeClick`. When the user has premium access:
- The button will call `handlePremiumClick()` instead, which already has the correct logic to redirect to the premium chatbot path (lines 170-173 in the existing code).
- For non-premium users, it will continue calling `handleFreeClick` as before.

### Technical Detail

The `payment_type` field in `user_subscriptions` is either `'monthly'` or `'lifetime'`. The `checkProductAccess` function already returns the full subscription object, so no backend changes are needed.

