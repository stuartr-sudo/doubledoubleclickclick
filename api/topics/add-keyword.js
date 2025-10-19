import { validateRequest, validateSchema } from '../utils/validation';
import { sendResponse } from '../utils/response';
import { getSupabaseClient } from '../utils/supabase';

export default async function handler(req, res) {
  if (!validateRequest(req, res, 'POST')) {
    return;
  }

  const schema = {
    type: 'object',
    properties: {
      username_id: { type: 'string' },
      keyword: { type: 'string' },
    },
    required: ['username_id', 'keyword'],
    additionalProperties: false,
  };

  if (!validateSchema(req, res, schema)) {
    return;
  }

  const { username_id, keyword } = req.body;

  try {
    const supabase = getSupabaseClient(req);
    
    // Get the current username record
    const { data: username, error: fetchError } = await supabase
      .from('usernames')
      .select('topics')
      .eq('id', username_id)
      .single();

    if (fetchError) {
      return sendResponse(res, 404, { success: false, error: 'Username not found' });
    }

    // Add the new keyword to the topics array
    const currentTopics = username.topics || [];
    const updatedTopics = Array.from(new Set([...currentTopics, keyword]));

    // Update the username record
    const { error: updateError } = await supabase
      .from('usernames')
      .update({ topics: updatedTopics })
      .eq('id', username_id);

    if (updateError) {
      return sendResponse(res, 500, { success: false, error: 'Failed to update username topics' });
    }

    return sendResponse(res, 200, { success: true, topics: updatedTopics });
  } catch (error) {
    console.error('Add keyword error:', error);
    return sendResponse(res, 500, { success: false, error: error.message || 'Internal server error' });
  }
}
