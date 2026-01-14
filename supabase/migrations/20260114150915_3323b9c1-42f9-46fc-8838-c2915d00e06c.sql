-- Drop the restrictive policy
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Create a permissive policy instead
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
TO authenticated, anon
USING (active = true);