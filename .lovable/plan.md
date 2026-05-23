## Grant Evie Goldstone Exam Season Pass — A-Level Edexcel Mathematics

**User:** evie.goldstone@gmail.com (`16c6b6d1-2747-4141-8175-48ecb21a71ac`)
**Product:** Edexcel Mathematics Deluxe — A Level (`f47ac10b-58cc-4372-a567-0e02b2c3d479`, slug `edexcel-mathematics`)

### Action
Insert one row into `user_subscriptions`, mirroring her existing AQA Psychology season-pass row:

- `user_id` = 16c6b6d1-2747-4141-8175-48ecb21a71ac
- `product_id` = f47ac10b-58cc-4372-a567-0e02b2c3d479
- `tier` = `deluxe`
- `payment_type` = `lifetime` (Exam Season Pass convention used on her existing row)
- `active` = true
- `subscription_end` = `2026-06-30 23:59:59+00` (matches her current pass window)
- `stripe_subscription_id` = null (manual grant)

### Side effects
- `checkProductAccess('edexcel-mathematics')` → Deluxe immediately.
- Via `BUNDLED_SLUGS`, this also unlocks **Edexcel Mathematics Applied** automatically — no second row needed.
- No Stripe activity, no webhook, no email.

Confirm and I'll run the insert.
