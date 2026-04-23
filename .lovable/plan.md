
## Grant Deluxe access — AQA Psychology

**User:** oluchi.nwokobia008@gmail.com (`418d9096-79a7-499d-923f-29bbb448bbff`)
**Product:** AQA Psychology (`c56bc6d6-5074-4e1f-8bf2-8e900ba928ec`)
**Current state:** No existing subscription row for this user/product.

### Action
Insert one row into `public.user_subscriptions`:
- `user_id`: 418d9096-79a7-499d-923f-29bbb448bbff
- `product_id`: c56bc6d6-5074-4e1f-8bf2-8e900ba928ec
- `tier`: `deluxe`
- `payment_type`: `comp` (complimentary — no Stripe IDs)
- `active`: `true`
- `subscription_end`: 1 year from now (2027-04-23)
- `started_at`: now

This matches how `checkProductAccess` validates access (active row + valid `subscription_end`), so the user will immediately have Deluxe access to the AQA Psychology premium page.

### Out of scope
- No schema changes
- No Stripe customer/subscription linkage (manual comp grant)
- No changes to other products
