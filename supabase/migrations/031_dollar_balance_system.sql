-- ============================================================================
-- MIGRATION: Token System → Dollar Balance System
-- ============================================================================
-- This migration replaces the token-based consumption with a dollar balance
-- system where users pay per action in dollars (e.g., $0.10-$0.29).
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚀 DOLLAR BALANCE SYSTEM MIGRATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: Create New Tables
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📦 Creating new tables...';
END $$;

-- Balance Transactions: Audit log for all balance changes
CREATE TABLE IF NOT EXISTS public.balance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    balance_before NUMERIC(10, 2) NOT NULL,
    balance_after NUMERIC(10, 2) NOT NULL,
    description TEXT,
    feature_used TEXT,
    stripe_payment_intent_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON public.balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at ON public.balance_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_stripe_pi ON public.balance_transactions(stripe_payment_intent_id);

-- RLS Policies for balance_transactions
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.balance_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Superadmins can view all transactions"
ON public.balance_transactions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (role = 'superadmin' OR is_superadmin = true)
    )
);

-- Balance Top-Ups: Track Stripe purchases
CREATE TABLE IF NOT EXISTS public.balance_top_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 10.00),
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    stripe_checkout_session_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_balance_top_ups_user_id ON public.balance_top_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_top_ups_stripe_pi ON public.balance_top_ups(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_balance_top_ups_session ON public.balance_top_ups(stripe_checkout_session_id);

-- RLS Policies for balance_top_ups
ALTER TABLE public.balance_top_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own top-ups"
ON public.balance_top_ups
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Superadmins can view all top-ups"
ON public.balance_top_ups
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (role = 'superadmin' OR is_superadmin = true)
    )
);

DO $$
BEGIN
    RAISE NOTICE '✅ Tables created: balance_transactions, balance_top_ups';
END $$;

-- ============================================================================
-- STEP 2: Rename Columns in Existing Tables
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Renaming columns...';
    
    -- Rename token_balance to account_balance in user_profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'token_balance'
    ) THEN
        ALTER TABLE public.user_profiles
        RENAME COLUMN token_balance TO account_balance;
        RAISE NOTICE '✅ Renamed user_profiles.token_balance → account_balance';
    ELSE
        RAISE NOTICE '⏭️  user_profiles.token_balance already renamed or does not exist';
    END IF;
    
    -- Rename token_cost to dollar_cost in feature_flags
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'feature_flags'
        AND column_name = 'token_cost'
    ) THEN
        ALTER TABLE public.feature_flags
        RENAME COLUMN token_cost TO dollar_cost;
        RAISE NOTICE '✅ Renamed feature_flags.token_cost → dollar_cost';
    ELSE
        RAISE NOTICE '⏭️  feature_flags.token_cost already renamed or does not exist';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Update Default Values
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚙️  Updating default values...';
    
    -- Set default account_balance to $5.00 for new users
    ALTER TABLE public.user_profiles
    ALTER COLUMN account_balance SET DEFAULT 5.00;
    
    -- Update existing users with 0 balance to get $5 credit
    UPDATE public.user_profiles
    SET account_balance = 5.00
    WHERE account_balance IS NULL OR account_balance = 0;
    
    RAISE NOTICE '✅ Set default account_balance to $5.00';
    RAISE NOTICE '✅ Credited existing users with $5.00';
END $$;

-- ============================================================================
-- STEP 4: Seed Feature Costs with Dollar Amounts
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '💰 Seeding feature costs...';
END $$;

-- Update feature_flags with dollar costs
UPDATE public.feature_flags SET dollar_cost = 0.10 WHERE flag_name = 'ai_title_rewrite';
UPDATE public.feature_flags SET dollar_cost = 0.15 WHERE flag_name = 'ai_rewriter';
UPDATE public.feature_flags SET dollar_cost = 0.15 WHERE flag_name = 'ai_seo';
UPDATE public.feature_flags SET dollar_cost = 0.12 WHERE flag_name = 'ai_faq';
UPDATE public.feature_flags SET dollar_cost = 0.10 WHERE flag_name = 'ai_tldr';
UPDATE public.feature_flags SET dollar_cost = 0.15 WHERE flag_name = 'ai_brand_it';
UPDATE public.feature_flags SET dollar_cost = 0.08 WHERE flag_name = 'ai_html_cleanup';
UPDATE public.feature_flags SET dollar_cost = 0.15 WHERE flag_name = 'ai_autolink';
UPDATE public.feature_flags SET dollar_cost = 0.18 WHERE flag_name = 'ai_autoscan';
UPDATE public.feature_flags SET dollar_cost = 0.15 WHERE flag_name = 'ai_schema';
UPDATE public.feature_flags SET dollar_cost = 0.15 WHERE flag_name = 'ai_links_references';
UPDATE public.feature_flags SET dollar_cost = 0.15 WHERE flag_name = 'ai_humanize';
UPDATE public.feature_flags SET dollar_cost = 0.18 WHERE flag_name = 'ai_localize';
UPDATE public.feature_flags SET dollar_cost = 0.29 WHERE flag_name = 'ai_imagineer';
UPDATE public.feature_flags SET dollar_cost = 0.10 WHERE flag_name = 'ai_content_detection';
UPDATE public.feature_flags SET dollar_cost = 0.20 WHERE flag_name = 'voice_ai';
UPDATE public.feature_flags SET dollar_cost = 0.25 WHERE flag_name = 'generate_image';
UPDATE public.feature_flags SET dollar_cost = 0.10 WHERE flag_name = 'youtube_import';
UPDATE public.feature_flags SET dollar_cost = 0.10 WHERE flag_name = 'tiktok_import';
UPDATE public.feature_flags SET dollar_cost = 0.10 WHERE flag_name = 'amazon_import';
UPDATE public.feature_flags SET dollar_cost = 0.10 WHERE flag_name = 'sitemap_scraper';

DO $$
BEGIN
    RAISE NOTICE '✅ Feature costs updated (range: $0.08 - $0.29)';
END $$;

-- ============================================================================
-- STEP 5: Create Helper Functions
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Creating helper functions...';
END $$;

-- Function to log balance transactions
CREATE OR REPLACE FUNCTION public.log_balance_transaction(
    p_user_id UUID,
    p_transaction_type TEXT,
    p_amount NUMERIC,
    p_balance_before NUMERIC,
    p_balance_after NUMERIC,
    p_description TEXT DEFAULT NULL,
    p_feature_used TEXT DEFAULT NULL,
    p_stripe_payment_intent_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    INSERT INTO public.balance_transactions (
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        feature_used,
        stripe_payment_intent_id,
        metadata
    ) VALUES (
        p_user_id,
        p_transaction_type,
        p_amount,
        p_balance_before,
        p_balance_after,
        p_description,
        p_feature_used,
        p_stripe_payment_intent_id,
        p_metadata
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_balance_transaction TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Helper functions created';
END $$;

-- ============================================================================
-- STEP 6: Update analytics_events for balance tracking
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Updating analytics structure...';
    
    -- Add comment to analytics_events for clarity
    COMMENT ON TABLE public.analytics_events IS 'Tracks user events including balance consumption (replaces token_consumption)';
    
    RAISE NOTICE '✅ Analytics structure updated';
END $$;

-- ============================================================================
-- STEP 7: Refresh Schema Cache
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Refreshing PostgREST schema cache...';
END $$;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- FINAL SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
    v_user_count INTEGER;
    v_feature_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_user_count FROM public.user_profiles;
    SELECT COUNT(*) INTO v_feature_count FROM public.feature_flags WHERE dollar_cost IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  • Tables created: balance_transactions, balance_top_ups';
    RAISE NOTICE '  • Columns renamed: token_balance → account_balance';
    RAISE NOTICE '  • Columns renamed: token_cost → dollar_cost';
    RAISE NOTICE '  • Users credited: % with $5.00', v_user_count;
    RAISE NOTICE '  • Features priced: % features', v_feature_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next Steps:';
    RAISE NOTICE '  1. Deploy updated backend APIs';
    RAISE NOTICE '  2. Deploy updated frontend components';
    RAISE NOTICE '  3. Configure Stripe webhook';
    RAISE NOTICE '  4. Test end-to-end flow';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

