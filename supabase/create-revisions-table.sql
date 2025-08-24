-- Create Revisions and Revision Images Tables
-- These tables handle revision requests and revision image uploads
-- Run this in Supabase SQL Editor to add revision functionality

-- Create revisions table
CREATE TABLE IF NOT EXISTS public.revisions (
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

-- Create revision_images table
CREATE TABLE IF NOT EXISTS public.revision_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID REFERENCES public.revisions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  filename TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_revisions_order_item_id ON public.revisions(order_item_id);
CREATE INDEX IF NOT EXISTS idx_revisions_assigned_to ON public.revisions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_revisions_status ON public.revisions(status);
CREATE INDEX IF NOT EXISTS idx_revision_images_revision_id ON public.revision_images(revision_id);

-- Enable Row Level Security
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_images ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "revision_images_update_policy" ON public.revision_images
  FOR UPDATE USING (
    -- Assigned editor can update revision images
    EXISTS (
      SELECT 1 FROM public.revisions r
      WHERE r.id = revision_id AND r.assigned_to = auth.uid()
    ) OR
    -- Staff/admin can update all revision images
    public.has_role('staff')
  );

CREATE POLICY "revision_images_delete_policy" ON public.revision_images
  FOR DELETE USING (
    -- Assigned editor can delete revision images
    EXISTS (
      SELECT 1 FROM public.revisions r
      WHERE r.id = revision_id AND r.assigned_to = auth.uid()
    ) OR
    -- Staff/admin can delete all revision images
    public.has_role('staff')
  );

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_revisions_updated_at ON public.revisions;
CREATE TRIGGER update_revisions_updated_at
  BEFORE UPDATE ON public.revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.revisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revision_images TO authenticated;

SELECT 'Revisions and revision images tables created successfully with RLS policies!' as message;