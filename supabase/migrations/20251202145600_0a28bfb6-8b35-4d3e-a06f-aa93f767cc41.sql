-- Delete the incorrect Edexcel subscription for the test user (they only bought AQA)
DELETE FROM user_subscriptions 
WHERE user_id = 'bef69303-bd18-4c55-ba8e-475e85bf3718' 
AND product_id = '6dc19d53-8a88-4741-9528-f25af97afb21';

-- Also reset is_premium in legacy users table for this test user since they're AQA-only
UPDATE users 
SET is_premium = false 
WHERE id = 'bef69303-bd18-4c55-ba8e-475e85bf3718';