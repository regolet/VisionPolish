-- VisionPolish Photo Editing Platform - Optimized Database Schema
-- This is the complete, migration-ready schema for production deployment
-- Run this single file to set up the entire database structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Users profile table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'editor', 'staff', 'admin')),
  is_active BOOLEAN DEFAULT true,
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
  assigned_editor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'assigned', 'in_progress', 'completed', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
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
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart table for temporary storage
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uploaded images table (legacy support, but specifications.photos is preferred)
CREATE TABLE public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  cart_item_id UUID REFERENCES public.cart_items(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  processed_url TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'processing', 'completed', 'failed')),
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

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_assigned_editor ON public.orders(assigned_editor_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_uploaded_images_order_item ON public.uploaded_images(order_item_id);
CREATE INDEX idx_uploaded_images_cart_item ON public.uploaded_images(cart_item_id);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_active ON public.services(is_active);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Services policies
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Admins and staff can manage services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
    )
  );

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = assigned_editor_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Editors and admins can update orders" ON public.orders
  FOR UPDATE USING (
    auth.uid() = assigned_editor_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
    )
  );

-- Order items policies
CREATE POLICY "Users can view order items for accessible orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id 
      AND (
        o.user_id = auth.uid() OR
        o.assigned_editor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
        )
      )
    )
  );

CREATE POLICY "Users can create order items for their orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id 
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can update order items" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id 
      AND (
        o.assigned_editor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
        )
      )
    )
  );

-- Cart policies
CREATE POLICY "Users can manage own cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Uploaded images policies
CREATE POLICY "Users can view images for accessible content" ON public.uploaded_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = uploaded_images.order_item_id 
      AND (
        o.user_id = auth.uid() OR
        o.assigned_editor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
        )
      )
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.cart_items ci
      WHERE ci.id = uploaded_images.cart_item_id
      AND ci.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create images for accessible content" ON public.uploaded_images
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

CREATE POLICY "Editors and admins can update images" ON public.uploaded_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = uploaded_images.order_item_id 
      AND (
        o.assigned_editor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
        )
      )
    )
  );

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their orders" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = reviews.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'VP-' || LPAD(nextval('order_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- Trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Function to get users with email (for admin user management)
CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email::TEXT,
    p.full_name,
    p.role,
    p.is_active,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STORAGE SETUP
-- =============================================

-- Create storage bucket for uploads (main bucket used by the app)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket
CREATE POLICY "Uploads are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Editors and admins can manage all uploads
CREATE POLICY "Editors and admins can manage all uploads" ON storage.objects
  FOR ALL USING (
    bucket_id = 'uploads' AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff', 'editor')
    )
  );

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default services
INSERT INTO public.services (name, description, category, base_price, turnaround_time, features, image_url, is_active) VALUES
  (
    'Photo Retouching', 
    'Professional retouching to enhance portraits and remove imperfections', 
    'portrait', 
    15.00, 
    '24-48 hours', 
    ARRAY['Skin smoothing', 'Blemish removal', 'Teeth whitening', 'Eye enhancement', 'Color correction'], 
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400', 
    true
  ),
  (
    'Background Removal', 
    'Clean, precise background removal for product photos and portraits', 
    'product', 
    5.00, 
    '12-24 hours', 
    ARRAY['Transparent background', 'White background option', 'Custom background', 'Edge refinement'], 
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 
    true
  ),
  (
    'Color Correction', 
    'Expert color grading and correction for vibrant, balanced images', 
    'creative', 
    10.00, 
    '24 hours', 
    ARRAY['Color balance adjustment', 'Brightness/contrast', 'Saturation enhancement', 'White balance', 'Tone mapping'], 
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', 
    true
  ),
  (
    'Image Restoration', 
    'Restore old, damaged photos to their former glory', 
    'restoration', 
    25.00, 
    '48-72 hours', 
    ARRAY['Damage repair', 'Color restoration', 'Scratch removal', 'Fade correction', 'Digital enhancement'], 
    'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=400', 
    true
  ),
  (
    'Portrait Enhancement',
    'Professional portrait editing with natural-looking results',
    'portrait',
    12.00,
    '24-48 hours',
    ARRAY['Natural skin retouching', 'Hair enhancement', 'Makeup touch-ups', 'Lighting adjustment', 'Background softening'],
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    true
  ),
  (
    'Product Photography Edit',
    'Make your products look perfect for e-commerce and marketing',
    'product',
    8.00,
    '12-24 hours',
    ARRAY['Shadow removal', 'Reflection adjustment', 'Color enhancement', 'Brand consistency', 'Professional polish'],
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    true
  ),
  (
    'Creative Effects',
    'Add artistic flair and creative effects to your images',
    'creative',
    18.00,
    '24-48 hours',
    ARRAY['Artistic filters', 'HDR effects', 'Black & white conversion', 'Vintage styling', 'Custom effects'],
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
    true
  ),
  (
    'Photo Restoration Plus',
    'Advanced restoration for severely damaged historical photos',
    'restoration',
    40.00,
    '72-96 hours',
    ARRAY['Advanced damage repair', 'Missing parts recreation', 'Historical colorization', 'Family photo restoration', 'Archive quality output'],
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    true
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$ 
BEGIN 
  RAISE NOTICE 'VisionPolish database schema setup completed successfully!';
  RAISE NOTICE 'Total tables created: 7';
  RAISE NOTICE 'Total services inserted: 8';
  RAISE NOTICE 'Storage bucket created: uploads';
  RAISE NOTICE 'All RLS policies and functions are active.';
END $$;