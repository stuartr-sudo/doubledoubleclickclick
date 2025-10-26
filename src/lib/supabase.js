import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  let profile = null;
  
  // Try to fetch existing profile
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 results
  
  if (error) {
    console.error('Error fetching user profile:', error);
    // Don't return null yet - try to create the profile
  }
  
  profile = data;
  
  // If no profile exists, create one (failsafe in case trigger didn't fire)
  if (!profile) {
    console.log('No profile found, creating one...');
    try {
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email,
          role: 'user',
          is_superadmin: false,
          account_balance: 5.00  // Default $5.00 for new users
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user profile:', createError);
        // Even if profile creation fails, return basic user info from session
      } else {
        profile = newProfile;
        console.log('Profile created successfully');
      }
    } catch (err) {
      console.error('Exception creating profile:', err);
    }
  }
  
  // Return user data (either from profile or fallback to session)
  return {
    id: session.user.id,
    email: session.user.email,
    full_name: profile?.full_name || session.user.user_metadata?.full_name || '',
    is_superadmin: profile?.is_superadmin || false,
    role: profile?.role || 'user',
    assigned_usernames: profile?.assigned_usernames || [],
    account_balance: profile?.account_balance !== undefined ? profile.account_balance : 5.00,  // Use account_balance, default to $5.00
    completed_tutorial_ids: profile?.completed_tutorial_ids || [],
    topics: profile?.topics || [],
    topics_onboarding_completed_at: profile?.topics_onboarding_completed_at,
    plan_price_id: profile?.plan_price_id
  };
};

