-- Phase 1: Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  subject text NOT NULL,
  exam_board text NOT NULL,
  chatbase_free_url text,
  chatbase_premium_url text,
  stripe_monthly_price_id text,
  stripe_lifetime_price_id text,
  monthly_price integer NOT NULL,
  lifetime_price integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (active = true);

-- Insert initial products (Edexcel and AQA)
INSERT INTO products (name, slug, subject, exam_board, chatbase_free_url, chatbase_premium_url, monthly_price, lifetime_price)
VALUES 
  ('Edexcel Economics Deluxe', 'edexcel-economics', 'Economics', 'Edexcel', 
   'https://www.chatbase.co/chatbot-iframe/FtdHzSh_RH8bsPVg3pObv', 
   'https://www.chatbase.co/chatbot-iframe/1l2aTsS1zKI3FgVTquzOu',
   499, 1999),
  ('AQA Economics', 'aqa-economics', 'Economics', 'AQA',
   'https://www.chatbase.co/chatbot-iframe/rRsRPPSXyI-f4kL8JHcyz',
   NULL,
   499, 1999);

-- Phase 2: Create User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  tier text NOT NULL CHECK (tier IN ('free', 'deluxe')),
  payment_type text CHECK (payment_type IN ('monthly', 'lifetime', 'manual')),
  
  stripe_subscription_id text,
  stripe_customer_id text,
  
  started_at timestamptz DEFAULT now(),
  subscription_end timestamptz,
  
  active boolean DEFAULT true,
  cancelled_at timestamptz,
  
  migrated_from_users_table boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_product_id ON user_subscriptions(product_id);
CREATE INDEX idx_user_subscriptions_active ON user_subscriptions(active) WHERE active = true;

-- Phase 3: CRITICAL MIGRATION - Migrate all 26 existing premium users to Edexcel product
INSERT INTO user_subscriptions (
  user_id, 
  product_id, 
  tier, 
  payment_type, 
  stripe_subscription_id, 
  stripe_customer_id, 
  subscription_end, 
  active,
  migrated_from_users_table,
  started_at
)
SELECT 
  u.id,
  (SELECT id FROM products WHERE slug = 'edexcel-economics' LIMIT 1),
  'deluxe',
  COALESCE(u.payment_type, 'manual'),
  u.stripe_subscription_id,
  u.stripe_customer_id,
  u.subscription_end,
  u.is_premium,
  true,
  u.created_at
FROM users u
WHERE u.is_premium = true
ON CONFLICT DO NOTHING;