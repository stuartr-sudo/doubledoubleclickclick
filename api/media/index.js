import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '../utils/validation.js';
import { createResponse } from '../utils/response.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    const { method } = req;
    const { action } = req.query;

    // Validate request
    const validation = await validateRequest(req, {
      requiredAuth: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;

    // Route to appropriate handler based on action
    switch (action) {
      case 'upload':
        return await handleUpload(req, res, user);
      case 'upload-private':
        return await handleUploadPrivate(req, res, user);
      case 'create-signed-url':
        return await handleCreateSignedUrl(req, res, user);
      default:
        return createResponse(res, { error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('Media API error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}

async function handleUpload(req, res, user) {
  try {
    const { fileName, fileType, fileData } = req.body;

    if (!fileName || !fileType || !fileData) {
      return createResponse(res, { error: 'fileName, fileType, and fileData are required' }, 400);
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${user.id}/${timestamp}_${fileName}`;

    // Upload to Supabase Storage (public bucket)
    const { data, error } = await supabase.storage
      .from('public-files')
      .upload(uniqueFileName, buffer, {
        contentType: fileType,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return createResponse(res, { error: 'Failed to upload file' }, 500);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('public-files')
      .getPublicUrl(uniqueFileName);

    // Store file metadata in database
    await supabase
      .from('file_uploads')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_path: uniqueFileName,
        file_type: fileType,
        file_size: buffer.length,
        is_public: true,
        public_url: publicUrlData.publicUrl
      });

    return createResponse(res, {
      success: true,
      file_path: uniqueFileName,
      public_url: publicUrlData.publicUrl,
      file_size: buffer.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return createResponse(res, { error: 'Failed to upload file' }, 500);
  }
}

async function handleUploadPrivate(req, res, user) {
  try {
    const { fileName, fileType, fileData } = req.body;

    if (!fileName || !fileType || !fileData) {
      return createResponse(res, { error: 'fileName, fileType, and fileData are required' }, 400);
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${user.id}/private/${timestamp}_${fileName}`;

    // Upload to Supabase Storage (private bucket)
    const { data, error } = await supabase.storage
      .from('private-files')
      .upload(uniqueFileName, buffer, {
        contentType: fileType,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return createResponse(res, { error: 'Failed to upload file' }, 500);
    }

    // Store file metadata in database
    await supabase
      .from('file_uploads')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_path: uniqueFileName,
        file_type: fileType,
        file_size: buffer.length,
        is_public: false
      });

    return createResponse(res, {
      success: true,
      file_path: uniqueFileName,
      file_size: buffer.length
    });

  } catch (error) {
    console.error('Upload private error:', error);
    return createResponse(res, { error: 'Failed to upload private file' }, 500);
  }
}

async function handleCreateSignedUrl(req, res, user) {
  try {
    const { filePath, expiresIn = 3600 } = req.body;

    if (!filePath) {
      return createResponse(res, { error: 'filePath is required' }, 400);
    }

    // Verify user owns the file
    const { data: fileData } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', user.id)
      .eq('file_path', filePath)
      .single();

    if (!fileData) {
      return createResponse(res, { error: 'File not found or access denied' }, 404);
    }

    // Create signed URL
    const { data, error } = await supabase.storage
      .from('private-files')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return createResponse(res, { error: 'Failed to create signed URL' }, 500);
    }

    return createResponse(res, {
      success: true,
      signed_url: data.signedUrl,
      expires_in: expiresIn
    });

  } catch (error) {
    console.error('Create signed URL error:', error);
    return createResponse(res, { error: 'Failed to create signed URL' }, 500);
  }
}
