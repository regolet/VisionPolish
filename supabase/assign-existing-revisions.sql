-- Assign existing unassigned revisions to their effective editors
-- This helps fix any revisions created before the auto-assignment was implemented

-- Update revisions that don't have assigned_to set
UPDATE public.revisions 
SET assigned_to = COALESCE(
  -- Try item-level assignment first
  (SELECT oi.assigned_editor 
   FROM public.order_items oi 
   WHERE oi.id = revisions.order_item_id 
   AND oi.assigned_editor IS NOT NULL),
  -- Fall back to order-level assignment
  (SELECT o.assigned_editor 
   FROM public.order_items oi 
   JOIN public.orders o ON o.id = oi.order_id 
   WHERE oi.id = revisions.order_item_id 
   AND o.assigned_editor IS NOT NULL)
)
WHERE assigned_to IS NULL 
  AND status = 'pending';

-- Show results of the assignment
SELECT 
  'ASSIGNMENT_RESULTS' as query_type,
  COUNT(*) as total_revisions,
  COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned_revisions,
  COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned_revisions
FROM public.revisions
WHERE status = 'pending';

-- Show any still-unassigned revisions (these may need manual intervention)
SELECT 
  'STILL_UNASSIGNED' as query_type,
  r.id as revision_id,
  r.order_item_id,
  o.order_number,
  o.assigned_editor as order_editor,
  oi.assigned_editor as item_editor,
  r.notes
FROM public.revisions r
JOIN public.order_items oi ON oi.id = r.order_item_id
JOIN public.orders o ON o.id = oi.order_id
WHERE r.status = 'pending' 
  AND r.assigned_to IS NULL;