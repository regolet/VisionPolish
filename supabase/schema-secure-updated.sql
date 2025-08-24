-- VisionPolish Database Schema
-- Production-ready schema with comprehensive security enhancements
-- 
-- Features:
-- - Role-based access control (Customer, Editor, Staff, Admin)
-- - Row Level Security (RLS) policies
-- - Audit logging and security event tracking
-- - Secure file storage with user segregation
-- - Performance optimized indexes
-- 
-- Run this script in Supabase SQL Editor to create the complete schema

-- Core Tables

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
  assigned_editor UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table with item-level editor assignment
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  assigned_editor UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Audit & Security Tables

-- Audit log table for security events
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events table
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'login_attempt', 'failed_login', 'permission_denied', 'suspicious_activity'
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes

-- User and role indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Order management indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_assigned_editor ON public.orders(assigned_editor);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_assigned_editor ON public.order_items(assigned_editor);

-- File management indexes
CREATE INDEX idx_uploaded_images_order_item_id ON public.uploaded_images(order_item_id);
CREATE INDEX idx_uploaded_images_cart_item_id ON public.uploaded_images(cart_item_id);

-- Shopping and review indexes
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_reviews_service_id ON public.reviews(service_id);

-- Audit and security indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);

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

-- Function to get effective editor for order item
CREATE OR REPLACE FUNCTION public.get_item_editor(item_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(oi.assigned_editor, o.assigned_editor)
  FROM public.order_items oi
  LEFT JOIN public.orders o ON oi.order_id = o.id
  WHERE oi.id = item_id;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  severity TEXT DEFAULT 'info',
  description TEXT DEFAULT NULL,
  metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  INSERT INTO public.security_events (
    user_id, event_type, severity, description, metadata,
    ip_address, user_agent
  )
  VALUES (
    auth.uid(), event_type, severity, description, metadata,
    CAST(current_setting('request.headers', true)::json->>'x-forwarded-for' AS INET),
    current_setting('request.headers', true)::json->>'user-agent'
  )
  RETURNING id;
$$;

-- Function for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit logging trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR public.has_role('staff')
  );

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    id = auth.uid()
  );

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR public.has_role('admin')
  );

-- Services policies
CREATE POLICY "services_select_policy" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "services_modify_policy" ON public.services
  FOR ALL USING (public.has_role('staff'));

-- Orders policies
CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid() OR
    assigned_editor = auth.uid() OR
    public.has_role('staff')
  );

CREATE POLICY "orders_insert_policy" ON public.orders
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR public.has_role('staff')
  );

CREATE POLICY "orders_update_policy" ON public.orders
  FOR UPDATE USING (
    user_id = auth.uid() OR
    assigned_editor = auth.uid() OR
    public.has_role('staff')
  );

-- Order items policies
CREATE POLICY "order_items_select_policy" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.user_id = auth.uid() OR
        o.assigned_editor = auth.uid() OR
        assigned_editor = auth.uid()
      )
    ) OR public.has_role('staff')
  );

CREATE POLICY "order_items_insert_policy" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.user_id = auth.uid() OR public.has_role('staff')
      )
    )
  );

CREATE POLICY "order_items_update_policy" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (
        o.assigned_editor = auth.uid() OR
        assigned_editor = auth.uid()
      )
    ) OR public.has_role('staff')
  );

-- Cart policies
CREATE POLICY "cart_items_policy" ON public.cart_items
  FOR ALL USING (
    user_id = auth.uid() OR public.has_role('staff')
  );

-- Uploaded images policies
CREATE POLICY "uploaded_images_select_policy" ON public.uploaded_images
  FOR SELECT USING (
    (order_item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id AND (
        o.user_id = auth.uid() OR
        o.assigned_editor = auth.uid() OR
        oi.assigned_editor = auth.uid()
      )
    )) OR
    (cart_item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.cart_items ci
      WHERE ci.id = cart_item_id AND ci.user_id = auth.uid()
    )) OR
    public.has_role('staff')
  );

CREATE POLICY "uploaded_images_insert_policy" ON public.uploaded_images
  FOR INSERT WITH CHECK (
    (order_item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id AND o.user_id = auth.uid()
    )) OR
    (cart_item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.cart_items ci
      WHERE ci.id = cart_item_id AND ci.user_id = auth.uid()
    )) OR
    public.has_role('staff')
  );

-- Reviews policies
CREATE POLICY "reviews_select_policy" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_policy" ON public.reviews
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- Audit & security policies (staff/admin only)
CREATE POLICY "audit_logs_policy" ON public.audit_logs
  FOR SELECT USING (public.has_role('staff'));

CREATE POLICY "security_events_policy" ON public.security_events
  FOR SELECT USING (public.has_role('staff'));

-- Triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers for critical tables
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_order_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Storage Configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos', 
  'photos', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/tiff']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket
CREATE POLICY "photos_select_policy" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'photos' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.has_role('staff')
    )
  );

CREATE POLICY "photos_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "photos_update_policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'photos' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.has_role('staff')
    )
  );

CREATE POLICY "photos_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.has_role('staff')
    )
  );

-- Utility Views
CREATE VIEW public.order_items_with_editors AS
SELECT 
  oi.*,
  COALESCE(oi.assigned_editor, o.assigned_editor) as effective_editor,
  editor.email as editor_email,
  editor.raw_user_meta_data->>'full_name' as editor_name,
  o.assigned_editor as order_level_editor,
  o.user_id as customer_id
FROM public.order_items oi
LEFT JOIN public.orders o ON oi.order_id = o.id
LEFT JOIN auth.users editor ON COALESCE(oi.assigned_editor, o.assigned_editor) = editor.id;

