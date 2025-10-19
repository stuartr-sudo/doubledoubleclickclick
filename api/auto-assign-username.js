import { validateRequest, validateSchema } from '../utils/validation';
import { sendResponse } from '../utils/response';
import { getSupabaseClient } from '../utils/supabase';

export default async function handler(req, res) {
  if (!validateRequest(req, res, 'POST')) {
    return;
  }

  try {
    const supabase = getSupabaseClient(req);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return sendResponse(res, 401, { success: false, error: 'Not authenticated' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('assigned_usernames, full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return sendResponse(res, 404, { success: false, error: 'User profile not found' });
    }

    // If user already has assigned usernames, return them
    if (profile.assigned_usernames && profile.assigned_usernames.length > 0) {
      return sendResponse(res, 200, { 
        success: true, 
        assigned_usernames: profile.assigned_usernames 
      });
    }

    // Generate username candidate from full_name or email
    const baseFromFullName = (profile.full_name || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24);

    const emailLocal = ((profile.email || user.email || "user").split("@")[0] || "user")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24);

    const candidate = baseFromFullName || emailLocal || "user";
    const uniqueName = candidate + '_' + Math.random().toString(36).substr(2, 9);

    // Update user profile with assigned username
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ assigned_usernames: [uniqueName] })
      .eq('id', user.id);

    if (updateError) {
      return sendResponse(res, 500, { success: false, error: 'Failed to assign username' });
    }

    return sendResponse(res, 200, { 
      success: true, 
      assigned_usernames: [uniqueName] 
    });
  } catch (error) {
    console.error('Auto assign username error:', error);
    return sendResponse(res, 500, { success: false, error: error.message || 'Internal server error' });
  }
}
