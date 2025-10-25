-- Get all table names from Supabase to ensure correct mapping

SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

