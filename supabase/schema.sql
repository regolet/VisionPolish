-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'editor', 'staff', 'admin')),
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

-- Enable Row Level Security
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

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
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