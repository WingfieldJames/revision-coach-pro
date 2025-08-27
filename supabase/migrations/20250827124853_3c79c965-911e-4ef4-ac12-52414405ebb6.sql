-- Fix security vulnerability in users table RLS policy
-- The current update_user policy allows any authenticated user to modify any user record
-- This needs to be restricted so users can only update their own records

-- Drop the existing insecure update policy
DROP POLICY IF EXISTS update_user ON public.users;

-- Create a secure update policy that only allows users to update their own records
CREATE POLICY "update_own_user" ON public.users
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());