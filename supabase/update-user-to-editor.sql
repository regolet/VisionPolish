-- Update current user role to editor for testing
-- Run this in Supabase SQL Editor

UPDATE public.profiles 
SET role = 'editor' 
WHERE id = '9489572b-41ff-4972-8c20-873ae178dc71';

SELECT 'User role updated to editor successfully!' as message;