INSERT INTO user_subscriptions (user_id, product_id, tier, active, payment_type, started_at)
SELECT '292730ea-5f60-486c-9436-81323e74338a', p.id, 'deluxe', true, 'lifetime', now()
FROM products p
WHERE p.active = true
  AND p.id NOT IN (
    SELECT product_id FROM user_subscriptions
    WHERE user_id = '292730ea-5f60-486c-9436-81323e74338a' AND active = true
  )
ON CONFLICT DO NOTHING;