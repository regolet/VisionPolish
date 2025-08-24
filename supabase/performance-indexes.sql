-- Performance Indexes for EditorDashboard Optimization
-- These indexes optimize the most frequently queried fields in the editor dashboard
-- Run this in Supabase SQL Editor to improve query performance

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_assigned_editor ON public.orders(assigned_editor);
CREATE INDEX IF NOT EXISTS idx_orders_status_assigned_editor ON public.orders(status, assigned_editor);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_assigned_editor ON public.order_items(assigned_editor);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_assigned ON public.order_items(order_id, assigned_editor);

-- Indexes for revisions table (already exists but ensuring completeness)
CREATE INDEX IF NOT EXISTS idx_revisions_assigned_to_status ON public.revisions(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_revisions_status_assigned ON public.revisions(status, assigned_to);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_id_name ON public.profiles(id, full_name);

-- Partial indexes for better performance on common filtered queries
CREATE INDEX IF NOT EXISTS idx_revisions_pending_assigned ON public.revisions(assigned_to, order_item_id) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_revisions_completed_with_images ON public.revisions(order_item_id, completed_at DESC) 
  WHERE status = 'completed';

-- Index for revision_images join
CREATE INDEX IF NOT EXISTS idx_revision_images_revision_uploaded ON public.revision_images(revision_id, uploaded_at DESC);

SELECT 'Performance indexes created successfully!' as message;