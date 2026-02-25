

## Why You See "Access Denied"

The Build Portal checks the `user_roles` table for your user ID with role = "trainer" or "admin". Either:

1. **You're not logged in** in the preview environment (the Lovable preview doesn't share your production session), OR
2. **Your user ID doesn't have a role entry** in the `user_roles` table

The session replay confirms you land on /build, see a brief loader, then immediately get "Access Denied".

## How to Fix

No code changes needed. You need to insert your role into the database:

1. Go to the Supabase SQL Editor
2. Run this query to find your user ID:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';
   ```
3. Then insert the trainer/admin role:
   ```sql
   INSERT INTO user_roles (user_id, role) 
   VALUES ('YOUR_USER_ID', 'admin');
   ```

If you've already done this and it still doesn't work, it may be a preview-vs-production login issue -- make sure you're logged in within the preview iframe itself (navigate to /login first).

## Technical Details

- File: `src/pages/BuildPage.tsx` (lines 196-208)
- The component queries `user_roles` for the authenticated user's ID
- Access is granted only if the result includes "trainer" or "admin"
- RLS on `user_roles` only allows users to SELECT their own rows (`user_id = auth.uid()`)

