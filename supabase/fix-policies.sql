-- Fix missing RLS policies that are causing 403 errors

-- Order items policies (MISSING - this is causing the 403 error)
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

-- Add cart_item_id column to uploaded_images if not exists
ALTER TABLE public.uploaded_images 
ADD COLUMN IF NOT EXISTS cart_item_id UUID REFERENCES public.cart_items(id) ON DELETE CASCADE;

-- Add constraint to ensure either order_item_id or cart_item_id is set
ALTER TABLE public.uploaded_images 
DROP CONSTRAINT IF EXISTS uploaded_images_reference_check;

ALTER TABLE public.uploaded_images 
ADD CONSTRAINT uploaded_images_reference_check CHECK (
  (order_item_id IS NOT NULL AND cart_item_id IS NULL) OR
  (order_item_id IS NULL AND cart_item_id IS NOT NULL)
);

-- Uploaded images policies
DROP POLICY IF EXISTS "Users can view images for their order items" ON public.uploaded_images;
DROP POLICY IF EXISTS "Users can create images for their order items" ON public.uploaded_images;

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