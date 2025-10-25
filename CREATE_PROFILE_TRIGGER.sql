-- ============================================================================
-- FIX: Create trigger to auto-create user_profiles on signup
-- ============================================================================

-- Drop existing function/trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        role,
        is_superadmin,
        token_balance,
        assigned_usernames,
        completed_tutorial_ids,
        created_date,
        updated_date
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user'::user_role,  -- Default role
        false,              -- Default not superadmin
        20,                 -- Default token balance
        ARRAY[]::TEXT[],    -- Empty array for usernames
        ARRAY[]::TEXT[],    -- Empty array for tutorials
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify trigger was created
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PROFILE AUTO-CREATE TRIGGER INSTALLED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Function: handle_new_user()';
    RAISE NOTICE 'Trigger: on_auth_user_created';
    RAISE NOTICE '';
    RAISE NOTICE 'Future signups will automatically:';
    RAISE NOTICE '  • Create user_profile';
    RAISE NOTICE '  • Set role to "user"';
    RAISE NOTICE '  • Give 20 tokens';
    RAISE NOTICE '  • Initialize empty arrays';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 You can now log in and access the app!';
    RAISE NOTICE '========================================';
END $$;

-- Show the trigger details
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

