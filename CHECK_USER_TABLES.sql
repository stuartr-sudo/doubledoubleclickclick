-- Check what user-related tables exist in your Supabase database
-- Run this in Supabase SQL Editor to diagnose the user management issue

-- 1. List all tables in the public schema that contain "user"
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%user%'
ORDER BY table_name;

-- 2. Check if user_profiles table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Count records in user_profiles (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) THEN
        RAISE NOTICE 'user_profiles exists';
        PERFORM * FROM user_profiles LIMIT 1;
    ELSE
        RAISE NOTICE 'user_profiles table does NOT exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error checking user_profiles: %', SQLERRM;
END $$;

-- 4. Check auth.users (Supabase auth table)
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 5. If user_profiles exists, show all records
SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 10;

-- 6. Check RLS policies on user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

