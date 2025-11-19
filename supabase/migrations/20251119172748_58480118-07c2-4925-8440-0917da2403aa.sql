-- Backfill existing Edexcel premium users into user_subscriptions table
-- This ensures all 26+ existing paid users are mapped to the edexcel-economics product

INSERT INTO user_subscriptions (
  user_id, 
  product_id, 
  tier, 
  payment_type, 
  stripe_subscription_id, 
  stripe_customer_id, 
  subscription_end, 
  active, 
  migrated_from_users_table
)
SELECT
  u.id as user_id,
  p.id as product_id,
  'deluxe' as tier,
  u.payment_type,
  u.stripe_subscription_id,
  u.stripe_customer_id,
  u.subscription_end,
  true as active,
  true as migrated_from_users_table
FROM users u
CROSS JOIN products p
WHERE p.slug = 'edexcel-economics'
  AND u.is_premium = true
  AND NOT EXISTS (
    SELECT 1
    FROM user_subscriptions us
    WHERE us.user_id = u.id
      AND us.product_id = p.id
      AND us.active = true
  );

-- Log the number of users migrated
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM user_subscriptions
  WHERE migrated_from_users_table = true;
  
  RAISE NOTICE 'Successfully migrated % existing premium users to user_subscriptions table', migrated_count;
END $$;