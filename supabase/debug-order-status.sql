-- Order Status Debugging Query
-- Run this in Supabase SQL Editor to check the current state of orders and revisions

-- 1. Check orders with revision-related statuses
SELECT 
  'ORDER_OVERVIEW' as query_type,
  o.id as order_id,
  o.order_number,
  o.status as current_order_status,
  o.user_id as customer_id,
  o.assigned_editor,
  o.created_at,
  o.updated_at
FROM orders o
WHERE o.status IN ('revision', 'completed', 'in_progress')
ORDER BY o.updated_at DESC
LIMIT 20;

-- 2. Check revisions and their status
SELECT 
  'REVISION_DETAILS' as query_type,
  o.id as order_id,
  o.order_number,
  o.status as order_status,
  oi.id as order_item_id,
  r.id as revision_id,
  r.status as revision_status,
  r.assigned_to as revision_assigned_editor,
  r.requested_at,
  r.completed_at,
  r.notes
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN revisions r ON r.order_item_id = oi.id
WHERE o.status IN ('revision', 'completed')
  AND r.id IS NOT NULL
ORDER BY o.id, r.created_at DESC;

-- 3. Check for inconsistent orders (orders marked as completed but with pending revisions)
SELECT 
  'INCONSISTENT_ORDERS' as query_type,
  o.id as order_id,
  o.order_number,
  o.status as order_status,
  COUNT(r.id) as total_revisions,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_revisions,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_revisions,
  'SHOULD_BE_REVISION_STATUS' as recommendation
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN revisions r ON r.order_item_id = oi.id
WHERE o.status = 'completed'
  AND r.id IS NOT NULL
GROUP BY o.id, o.order_number, o.status
HAVING COUNT(CASE WHEN r.status = 'pending' THEN 1 END) > 0;

-- 4. Check for orders that should be completed (revision status with no pending revisions)
SELECT 
  'SHOULD_BE_COMPLETED' as query_type,
  o.id as order_id,
  o.order_number,
  o.status as order_status,
  COUNT(r.id) as total_revisions,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_revisions,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_revisions,
  'SHOULD_BE_COMPLETED_STATUS' as recommendation
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN revisions r ON r.order_item_id = oi.id
WHERE o.status = 'revision'
  AND r.id IS NOT NULL
GROUP BY o.id, o.order_number, o.status
HAVING COUNT(CASE WHEN r.status = 'pending' THEN 1 END) = 0;

-- 5. Summary of all order statuses
SELECT 
  'STATUS_SUMMARY' as query_type,
  status,
  COUNT(*) as order_count
FROM orders
GROUP BY status
ORDER BY order_count DESC;