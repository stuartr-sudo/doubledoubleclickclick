import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, featureName } = req.body;

    if (!userId || !featureName) {
      return res.status(400).json({ error: 'Missing userId or featureName' });
    }

    // 1. Get the user's current token balance
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('token_balance, is_superadmin, plan_price_id')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Superadmins bypass token consumption
    if (userProfile.is_superadmin) {
      return res.json({
        success: true,
        message: 'Superadmin: no tokens consumed',
        remainingBalance: userProfile.token_balance,
        bypassedCharge: true
      });
    }

    // 3. Get the feature flag and its token cost
    const { data: featureFlag, error: flagError } = await supabase
      .from('feature_flags')
      .select('flag_name, is_enabled, token_cost, required_plan_keys, user_overrides, is_coming_soon')
      .eq('flag_name', featureName)
      .single();

    if (flagError || !featureFlag) {
      return res.status(404).json({ error: 'Feature flag not found' });
    }

    // 4. Check if feature is enabled
    if (!featureFlag.is_enabled) {
      return res.status(403).json({ error: 'Feature is disabled' });
    }

    // 5. Check if feature is coming soon
    if (featureFlag.is_coming_soon) {
      return res.status(403).json({ error: 'Feature is coming soon' });
    }

    // 6. Check user-specific overrides
    const userOverrides = featureFlag.user_overrides || {};
    if (typeof userOverrides[userId] === 'boolean' && !userOverrides[userId]) {
      return res.status(403).json({ error: 'Feature disabled for this user' });
    }

    // 7. Check plan requirements
    const requiredPlans = featureFlag.required_plan_keys || [];
    if (Array.isArray(requiredPlans) && requiredPlans.length > 0) {
      if (!userProfile.plan_price_id) {
        return res.status(403).json({ error: 'Plan required for this feature' });
      }

      const { data: userProduct } = await supabase
        .from('app_products')
        .select('plan_key')
        .eq('stripe_price_id', userProfile.plan_price_id)
        .single();

      if (!userProduct || !requiredPlans.includes(userProduct.plan_key)) {
        return res.status(403).json({ error: 'Insufficient plan for this feature' });
      }
    }

    // 8. Get token cost (default to 1 if not set)
    const tokenCost = parseFloat(featureFlag.token_cost) || 1;

    // 9. Check if user has enough tokens
    const currentBalance = parseFloat(userProfile.token_balance) || 0;
    if (currentBalance < tokenCost) {
      return res.status(402).json({
        error: 'Insufficient tokens',
        required: tokenCost,
        available: currentBalance
      });
    }

    // 10. Deduct tokens from user's balance
    const newBalance = currentBalance - tokenCost;
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ token_balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating token balance:', updateError);
      return res.status(500).json({ error: 'Failed to update token balance' });
    }

    // 11. Log the transaction (optional - create analytics_events entry)
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_name: 'token_consumption',
        properties: {
          feature: featureName,
          tokens_consumed: tokenCost,
          balance_before: currentBalance,
          balance_after: newBalance
        }
      });

    // 12. Return success
    return res.json({
      success: true,
      tokensConsumed: tokenCost,
      remainingBalance: newBalance,
      featureName
    });

  } catch (error) {
    console.error('Token consumption error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

