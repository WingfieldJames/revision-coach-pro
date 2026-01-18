-- Add product_id column to user_preferences for product-specific preferences
ALTER TABLE public.user_preferences 
ADD COLUMN product_id UUID REFERENCES public.products(id);

-- Drop existing unique constraint on user_id if it exists
ALTER TABLE public.user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_user_id_key;

-- Add new unique constraint for user_id + product_id combination
-- This allows one preference record per user per product (or one global with null product_id)
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_product_unique 
UNIQUE (user_id, product_id);

-- Add system prompt columns to products table for dynamic AI personalities
ALTER TABLE public.products 
ADD COLUMN system_prompt_free TEXT,
ADD COLUMN system_prompt_deluxe TEXT;