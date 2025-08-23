-- Helper function for editors to mark revision as completed
-- This can be called when editor uploads new edited images after revision

CREATE OR REPLACE FUNCTION mark_revision_completed(
  order_item_id UUID,
  revision_id TEXT
)
RETURNS void AS $$
DECLARE
  current_specs JSONB;
  updated_specs JSONB;
  revision_history JSONB;
  latest_revision JSONB;
BEGIN
  -- Get current specifications
  SELECT specifications INTO current_specs
  FROM order_items
  WHERE id = order_item_id;
  
  -- Get revision history
  revision_history := COALESCE(current_specs->'revisionHistory', '[]'::jsonb);
  
  -- Update the specific revision status and add completion timestamp
  revision_history := jsonb_set(
    revision_history,
    ARRAY[
      (
        SELECT (index-1)::text
        FROM jsonb_array_elements(revision_history) WITH ORDINALITY AS t(elem, index)
        WHERE elem->>'id' = revision_id
      )::int,
      'status'
    ],
    '"completed"'::jsonb
  );
  
  revision_history := jsonb_set(
    revision_history,
    ARRAY[
      (
        SELECT (index-1)::text
        FROM jsonb_array_elements(revision_history) WITH ORDINALITY AS t(elem, index)
        WHERE elem->>'id' = revision_id
      )::int,
      'completedAt'
    ],
    to_jsonb(NOW()::text)
  );
  
  -- Update latest revision if this is the most recent one
  SELECT elem INTO latest_revision
  FROM jsonb_array_elements(revision_history) AS elem
  WHERE elem->>'id' = revision_id;
  
  -- Update specifications
  updated_specs := jsonb_set(current_specs, '{revisionHistory}', revision_history);
  updated_specs := jsonb_set(updated_specs, '{latestRevision}', latest_revision);
  
  -- Update the order item
  UPDATE order_items
  SET specifications = updated_specs
  WHERE id = order_item_id;
  
END;
$$ LANGUAGE plpgsql;

-- Example usage (commented out):
-- SELECT mark_revision_completed('order-item-uuid', 'revision-id');