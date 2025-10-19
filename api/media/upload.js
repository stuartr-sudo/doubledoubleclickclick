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

    // Validate request
    const validation = await validateRequest(req, {
      requiredAuth: true,
      allowedMethods: ['POST']
    });

    if (!validation.success) {
      return createResponse(res, validation.error, 401);
    }

    const { user } = validation;

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    const bucket = formData.get('bucket') || 'images';
    const folder = formData.get('folder') || 'uploads';

    if (!file) {
      return createResponse(res, { error: 'No file provided' }, 400);
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return createResponse(res, { error: 'Invalid file type' }, 400);
    }

    if (file.size > maxSize) {
      return createResponse(res, { error: 'File too large' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return createResponse(res, { error: 'Failed to upload file' }, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('image_library_items')
      .insert({
        url: urlData.publicUrl,
        alt_text: file.name,
        source: 'upload',
        tags: [],
        user_name: user.email
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the upload if database insert fails
    }

    return createResponse(res, {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      fileName: fileName,
      fileId: fileRecord?.id,
      bucket: bucket
    });

  } catch (error) {
    console.error('Upload error:', error);
    return createResponse(res, { error: 'Internal server error' }, 500);
  }
}
