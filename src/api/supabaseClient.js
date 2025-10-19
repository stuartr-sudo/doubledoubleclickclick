import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

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
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return {
    id: session.user.id,
    email: session.user.email,
    full_name: profile?.full_name || session.user.user_metadata?.full_name || '',
    is_superadmin: profile?.is_superadmin || false,
    role: profile?.role || 'user',
    assigned_usernames: profile?.assigned_usernames || [],
    token_balance: profile?.token_balance || 0,
    completed_tutorial_ids: profile?.completed_tutorial_ids || []
  };
};

