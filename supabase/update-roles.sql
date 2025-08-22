-- Update roles to include editor and staff
-- Run this to add new role types to existing database

-- First, drop the existing constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with all role types
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'editor', 'staff', 'admin'));

-- Add description column for role capabilities
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create a roles reference table for documentation
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role TEXT PRIMARY KEY,
  description TEXT,
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_services BOOLEAN DEFAULT false,
  can_manage_orders BOOLEAN DEFAULT false,
  can_edit_photos BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert role definitions
INSERT INTO public.role_permissions (role, description, can_manage_users, can_manage_services, can_manage_orders, can_edit_photos, can_view_analytics)
VALUES 
  ('admin', 'Full system access - can manage everything', true, true, true, true, true),
  ('staff', 'Staff member - can manage orders and services', false, true, true, false, true),
  ('editor', 'Photo editor - can process and edit customer photos', false, false, true, true, false),
  ('customer', 'Regular customer - can place orders and view own data', false, false, false, false, false)
ON CONFLICT (role) DO UPDATE SET
  description = EXCLUDED.description,
  can_manage_users = EXCLUDED.can_manage_users,
  can_manage_services = EXCLUDED.can_manage_services,
  can_manage_orders = EXCLUDED.can_manage_orders,
  can_edit_photos = EXCLUDED.can_edit_photos,
  can_view_analytics = EXCLUDED.can_view_analytics;

-- Create policies for admin to manage users
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
    OR auth.uid() = id
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Grant RLS permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role permissions viewable by staff and above" ON public.role_permissions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'staff', 'editor')
    )
  );

-- Verify the update
SELECT 
  'Roles updated successfully' as status,
  array_agg(DISTINCT unnest) as available_roles
FROM (
  SELECT unnest(enum_range(NULL::text)::text[])
  FROM pg_constraint
  WHERE conname = 'profiles_role_check'
) as roles;