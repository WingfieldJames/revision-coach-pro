
-- Fix expired monthly subscriptions where active is still true
-- These users paid but the webhook didn't extend their subscription_end
UPDATE user_subscriptions 
SET subscription_end = (NOW() + INTERVAL '1 month')::timestamptz,
    updated_at = NOW()
WHERE payment_type = 'monthly' 
  AND active = true 
  AND subscription_end < NOW();

-- Also fix legacy users table for these same users
UPDATE users 
SET subscription_end = (NOW() + INTERVAL '1 month')::timestamptz,
    is_premium = true,
    updated_at = NOW()
WHERE id IN (
  SELECT user_id FROM user_subscriptions 
  WHERE payment_type = 'monthly' AND active = true
) AND subscription_end < NOW();
