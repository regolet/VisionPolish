-- Create admin user (alternative approach)
-- Run this in Supabase SQL Editor

-- Option 1: Update current user to admin (has access to everything)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '9489572b-41ff-4972-8c20-873ae178dc71';

-- Option 2: Or create a new admin user (if you want to keep customer separate)
-- First you'd need to sign up a new user, then run:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';

SELECT 'User role updated successfully!' as message;