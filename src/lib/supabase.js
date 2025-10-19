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
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return {
    id: session.user.id,
    email: session.user.email,
    full_name: profile?.full_name || '',
    is_superadmin: profile?.is_superadmin || false,
    role: profile?.role || 'user',
    assigned_usernames: profile?.assigned_usernames || [],
    token_balance: profile?.token_balance || 0,
    completed_tutorial_ids: profile?.completed_tutorial_ids || [],
    topics: profile?.topics || [],
    topics_onboarding_completed_at: profile?.topics_onboarding_completed_at,
    plan_price_id: profile?.plan_price_id
  };
};

