-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'editor', 'staff', 'admin')),
  is_active BOOLEAN DEFAULT true,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table for photo editing services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  turnaround_time TEXT,
  features TEXT[],
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uploaded images table
CREATE TABLE public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  cart_item_id UUID REFERENCES public.cart_items(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  processed_url TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  upload_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uploaded_images_reference_check CHECK (
    (order_item_id IS NOT NULL AND cart_item_id IS NULL) OR
    (order_item_id IS NULL AND cart_item_id IS NOT NULL)
  )
);

-- Cart table for temporary storage
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revisions table
CREATE TABLE public.revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  admin_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revision images table
CREATE TABLE public.revision_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES public.revisions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  filename TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_images ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Services policies
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT USING (true);

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Cart policies
CREATE POLICY "Users can view own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Uploaded images policies
CREATE POLICY "Users can view images for their order items" ON public.uploaded_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = uploaded_images.order_item_id 
      AND o.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.cart_items ci
      WHERE ci.id = uploaded_images.cart_item_id
      AND ci.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create images for their order items" ON public.uploaded_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = uploaded_images.order_item_id 
      AND o.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.cart_items ci
      WHERE ci.id = uploaded_images.cart_item_id
      AND ci.user_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their orders" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Revisions policies
CREATE POLICY "revisions_select_policy" ON public.revisions
  FOR SELECT USING (
    -- Customer can see revisions for their orders
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id AND o.user_id = auth.uid()
    ) OR
    -- Assigned editor can see their revisions
    assigned_to = auth.uid() OR
    -- Staff/admin can see all revisions
    public.has_role('staff')
  );

CREATE POLICY "revisions_insert_policy" ON public.revisions
  FOR INSERT WITH CHECK (
    -- Customer can create revisions for their orders
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id AND o.user_id = auth.uid()
    ) OR
    -- Staff can create revisions
    public.has_role('staff')
  );

CREATE POLICY "revisions_update_policy" ON public.revisions
  FOR UPDATE USING (
    -- Assigned editor can update their revisions
    assigned_to = auth.uid() OR
    -- Staff/admin can update all revisions
    public.has_role('staff')
  );

-- Revision images policies
CREATE POLICY "revision_images_select_policy" ON public.revision_images
  FOR SELECT USING (
    -- Customer can see revision images for their orders
    EXISTS (
      SELECT 1 FROM public.revisions r
      JOIN public.order_items oi ON oi.id = r.order_item_id
      JOIN public.orders o ON o.id = oi.order_id
      WHERE r.id = revision_id AND o.user_id = auth.uid()
    ) OR
    -- Assigned editor can see revision images for their revisions
    EXISTS (
      SELECT 1 FROM public.revisions r
      WHERE r.id = revision_id AND r.assigned_to = auth.uid()
    ) OR
    -- Staff/admin can see all revision images
    public.has_role('staff')
  );

CREATE POLICY "revision_images_insert_policy" ON public.revision_images
  FOR INSERT WITH CHECK (
    -- Assigned editor can upload revision images
    EXISTS (
      SELECT 1 FROM public.revisions r
      WHERE r.id = revision_id AND r.assigned_to = auth.uid()
    ) OR
    -- Staff can upload revision images
    public.has_role('staff')
  );

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Security Functions

-- Function to get user role securely
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN p.role IS NOT NULL THEN p.role
      WHEN u.raw_user_meta_data->>'role' IS NOT NULL THEN u.raw_user_meta_data->>'role'
      ELSE 'customer'
    END
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = user_id;
$$;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN required_role = 'customer' THEN true
      WHEN required_role = 'editor' THEN public.get_user_role(user_id) IN ('editor', 'staff', 'admin')
      WHEN required_role = 'staff' THEN public.get_user_role(user_id) IN ('staff', 'admin')
      WHEN required_role = 'admin' THEN public.get_user_role(user_id) = 'admin'
      ELSE false
    END;
$$;

-- Function to get user profile securely
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT,
  is_active BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name') as full_name,
    COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url') as avatar_url,
    p.phone,
    public.get_user_role(u.id) as role,
    COALESCE(p.is_active, true) as is_active
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = user_id AND COALESCE(p.is_active, true) = true;
$$;

-- Admin User Management Functions

-- Function to create user profile (admin only)
CREATE OR REPLACE FUNCTION public.admin_create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'customer',
  user_department TEXT DEFAULT NULL,
  user_is_active BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if the current user is an admin
  SELECT public.get_user_role(auth.uid()) INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Validate role
  IF user_role NOT IN ('customer', 'editor', 'staff', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be one of: customer, editor, staff, admin';
  END IF;

  -- Insert or update the profile
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    role,
    department,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_full_name,
    user_phone,
    user_role,
    user_department,
    user_is_active,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RETURN user_id;
END;
$$;

-- Function to update user profile (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  user_id UUID,
  user_full_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_role TEXT DEFAULT NULL,
  user_department TEXT DEFAULT NULL,
  user_is_active BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if the current user is an admin
  SELECT public.get_user_role(auth.uid()) INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Validate role if provided
  IF user_role IS NOT NULL AND user_role NOT IN ('customer', 'editor', 'staff', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be one of: customer, editor, staff, admin';
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  -- Update the profile
  UPDATE public.profiles SET
    full_name = COALESCE(user_full_name, full_name),
    phone = COALESCE(user_phone, phone),
    role = COALESCE(user_role, role),
    department = COALESCE(user_department, department),
    is_active = COALESCE(user_is_active, is_active),
    updated_at = NOW()
  WHERE id = user_id;

  RETURN true;
END;
$$;

-- Grant execute permissions to authenticated users (functions will check admin role internally)
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile TO authenticated;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revisions_updated_at BEFORE UPDATE ON public.revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Storage policies for photos bucket
CREATE POLICY "Photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);