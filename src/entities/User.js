// User entity - matches original Base44 structure
import { createEntityWrapper } from '@/api/entities';

export const User = createEntityWrapper('User');

// Add specific methods for User
User.me = async () => {
  const { supabase } = await import('@/api/supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

User.logout = async () => {
  const { supabase } = await import('@/api/supabaseClient');
  await supabase.auth.signOut();
};

User.loginWithRedirect = async (redirectUrl) => {
  const { supabase } = await import('@/api/supabaseClient');
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });
};
