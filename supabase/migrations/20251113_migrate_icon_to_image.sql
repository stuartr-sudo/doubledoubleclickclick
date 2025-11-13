-- Migrate icon field to image field in why_work_with_us_items
-- This migration updates existing data to use 'image' instead of 'icon'

UPDATE public.homepage_content
SET why_work_with_us_items = (
  SELECT jsonb_agg(
    CASE 
      WHEN item ? 'icon' THEN 
        item - 'icon' - 'link_text' - 'link_url' || jsonb_build_object('image', item->>'icon')
      ELSE 
        item - 'link_text' - 'link_url'
    END
  )
  FROM jsonb_array_elements(why_work_with_us_items) AS item
)
WHERE why_work_with_us_items IS NOT NULL 
  AND why_work_with_us_items != '[]'::jsonb
  AND why_work_with_us_items != 'null'::jsonb;

