-- Remove invalid/empty FAQPage schema from blog posts to fix duplicate FAQPage errors
-- FAQPage with actual FAQ content (questions/answers) is kept - only empty/invalid FAQPage is removed
-- This ensures blog posts with real FAQs keep their schema, while removing incorrectly generated ones

DO $$
DECLARE
  post_record RECORD;
  schema_json JSONB;
  updated_schema JSONB;
  has_faqpage BOOLEAN := false;
  graph_items JSONB;
  filtered_items JSONB := '[]'::JSONB;
  has_valid_faq BOOLEAN := false;
  question_item JSONB;
  faq_item JSONB;
  i INTEGER;
BEGIN
  -- Loop through all published posts with generated_llm_schema
  FOR post_record IN 
    SELECT id, slug, title, generated_llm_schema 
    FROM site_posts 
    WHERE status = 'published' 
      AND generated_llm_schema IS NOT NULL
      AND generated_llm_schema != ''
  LOOP
    BEGIN
      -- Parse the JSON schema
      schema_json := post_record.generated_llm_schema::JSONB;
      updated_schema := schema_json;
      has_faqpage := false;

      -- Check if entire schema is FAQPage
      IF schema_json->>'@type' = 'FAQPage' AND jsonb_typeof(schema_json) = 'object' THEN
        -- Check if FAQPage has valid FAQ content (mainEntity with questions)
        has_valid_faq := false;
        IF schema_json ? 'mainEntity' 
           AND jsonb_typeof(schema_json->'mainEntity') = 'array' 
           AND jsonb_array_length(schema_json->'mainEntity') > 0 THEN
          -- Check if at least one question has both name and acceptedAnswer
          FOR question_item IN SELECT * FROM jsonb_array_elements(schema_json->'mainEntity')
          LOOP
            IF question_item->>'@type' = 'Question' 
               AND question_item ? 'name' 
               AND question_item ? 'acceptedAnswer'
               AND question_item->'acceptedAnswer' ? 'text' THEN
              has_valid_faq := true;
              EXIT;
            END IF;
          END LOOP;
        END IF;
        
        -- If FAQPage has valid FAQs, keep it
        IF has_valid_faq THEN
          RAISE NOTICE 'Keeping FAQPage with valid FAQs for post: % (%)', post_record.slug, post_record.title;
          CONTINUE;
        END IF;
        
        -- FAQPage is empty/invalid, remove it
        UPDATE site_posts 
        SET generated_llm_schema = NULL 
        WHERE id = post_record.id;
        
        RAISE NOTICE 'Removed invalid/empty FAQPage schema from post: % (%)', post_record.slug, post_record.title;
        CONTINUE;
      END IF;

      -- Check if schema has @graph array
      IF schema_json ? '@graph' AND jsonb_typeof(schema_json->'@graph') = 'array' THEN
        graph_items := schema_json->'@graph';
        filtered_items := '[]'::JSONB;
        
        -- Filter FAQPage items - only keep if they have valid FAQ content
        FOR i IN 0..jsonb_array_length(graph_items) - 1 LOOP
          IF graph_items->i->>'@type' != 'FAQPage' THEN
            -- Keep all non-FAQPage items
            filtered_items := filtered_items || jsonb_build_array(graph_items->i);
          ELSE
            -- Check if FAQPage has valid FAQ content
            faq_item := graph_items->i;
            has_valid_faq := false;
            
            IF faq_item ? 'mainEntity' 
               AND jsonb_typeof(faq_item->'mainEntity') = 'array' 
               AND jsonb_array_length(faq_item->'mainEntity') > 0 THEN
              -- Check if at least one question has both name and acceptedAnswer
              FOR question_item IN SELECT * FROM jsonb_array_elements(faq_item->'mainEntity')
              LOOP
                IF question_item->>'@type' = 'Question' 
                   AND question_item ? 'name' 
                   AND question_item ? 'acceptedAnswer'
                   AND question_item->'acceptedAnswer' ? 'text' THEN
                  has_valid_faq := true;
                  EXIT;
                END IF;
              END LOOP;
            END IF;
            
            IF has_valid_faq THEN
              -- Keep FAQPage with valid FAQs
              filtered_items := filtered_items || jsonb_build_array(faq_item);
              RAISE NOTICE 'Keeping FAQPage with valid FAQs in @graph for post: % (%)', post_record.slug, post_record.title;
            ELSE
              -- Remove invalid/empty FAQPage
              has_faqpage := true;
              RAISE NOTICE 'Removing invalid/empty FAQPage from @graph for post: % (%)', post_record.slug, post_record.title;
            END IF;
          END IF;
        END LOOP;

        -- If FAQPage was found and removed, update the schema
        IF has_faqpage THEN
          updated_schema := jsonb_set(schema_json, '{@graph}', filtered_items);
          
          -- If @graph is now empty, remove the entire schema
          IF jsonb_array_length(filtered_items) = 0 THEN
            UPDATE site_posts 
            SET generated_llm_schema = NULL 
            WHERE id = post_record.id;
            
            RAISE NOTICE 'Removed empty @graph schema from post: % (%)', post_record.slug, post_record.title;
          ELSE
            -- Update with filtered schema
            UPDATE site_posts 
            SET generated_llm_schema = updated_schema::text 
            WHERE id = post_record.id;
            
            RAISE NOTICE 'Removed FAQPage from @graph for post: % (%)', post_record.slug, post_record.title;
          END IF;
        END IF;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Skip posts with invalid JSON
      RAISE NOTICE 'Skipping post % (%) due to JSON parsing error: %', post_record.slug, post_record.title, SQLERRM;
      CONTINUE;
    END;
  END LOOP;

  RAISE NOTICE 'Migration completed: FAQPage schema removed from blog posts';
END $$;
