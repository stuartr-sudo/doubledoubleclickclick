// Imagineer callback handler - receives completed image from external service
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const callbackSchema = z.object({
  job_id: z.string().min(1, 'job_id is required'),
  status: z.enum(['complete', 'failed']),
  image_url: z.string().url().optional()
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClientFromRequest(req, res);
    const payload = callbackSchema.parse(req.body);

    console.log('[Imagineer Callback] Received:', payload);

    // RACE FIX: Retry logic to wait for job to exist
    let job = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!job && attempts < maxAttempts) {
      const { data, error } = await supabase
        .from('imagineer_jobs')
        .select('*')
        .eq('job_id', payload.job_id)
        .limit(1);

      if (!error && data && data.length > 0) {
        job = data[0];
        break;
      }

      console.warn(`[Imagineer Callback] Attempt ${attempts + 1}: Job not found yet`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!job) {
      console.error(`[Imagineer Callback] Job ${payload.job_id} not found after ${maxAttempts} attempts`);
      return res.status(404).json({
        success: false,
        error: 'Job not found after retries'
      });
    }

    // Check if already completed
    if (job.status === 'completed' && job.image_url) {
      console.log(`[Imagineer Callback] Job ${payload.job_id} already completed, skipping duplicate`);
      return res.status(200).json({
        success: true,
        message: 'Job already completed'
      });
    }

    let finalImageUrl = payload.image_url;

    // Download and upload to our storage if image_url provided
    if (payload.image_url && payload.status === 'complete') {
      try {
        console.log(`[Imagineer Callback] Downloading image from:`, payload.image_url);

        const imageResponse = await fetch(payload.image_url);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.statusText}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBlob = new Blob([imageBuffer]);

        // Upload to Supabase Storage
        const fileName = `imagineer_${payload.job_id}_${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('public')
          .upload(fileName, imageBlob, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error('[Imagineer Callback] Upload error:', uploadError);
          finalImageUrl = payload.image_url; // Fall back to original
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('public')
            .getPublicUrl(fileName);
          finalImageUrl = publicUrl;
          console.log(`[Imagineer Callback] Uploaded to:`, finalImageUrl);
        }

      } catch (uploadErr) {
        console.error('[Imagineer Callback] Upload failed:', uploadErr);
        finalImageUrl = payload.image_url; // Fall back to original
      }

      // Create ImageLibraryItem
      try {
        await supabase
          .from('image_library_items')
          .insert({
            url: finalImageUrl,
            alt_text: job.prompt || 'AI generated image',
            source: 'ai_generated',
            user_name: job.user_name,
            tags: ['imagineer', 'ai-generated']
          });

        console.log(`[Imagineer Callback] ✅ ImageLibraryItem created`);
      } catch (libraryError) {
        console.error('[Imagineer Callback] ❌ Failed to create ImageLibraryItem:', libraryError);
      }
    }

    // Update job status
    const { error: updateError } = await supabase
      .from('imagineer_jobs')
      .update({
        status: payload.status === 'complete' ? 'completed' : 'failed',
        image_url: finalImageUrl
      })
      .eq('id', job.id);

    if (updateError) {
      console.error('[Imagineer Callback] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update job' });
    }

    console.log(`[Imagineer Callback] ✅ Job ${payload.job_id} updated`);

    return res.status(200).json({
      success: true,
      job_id: payload.job_id,
      status: payload.status === 'complete' ? 'completed' : 'failed',
      image_url: finalImageUrl
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Imagineer Callback] Error:', error);
    return res.status(500).json({
      error: error.message || 'Callback processing failed'
    });
  }
}

