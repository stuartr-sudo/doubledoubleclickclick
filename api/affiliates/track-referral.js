// Track affiliate referrals
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

const requestSchema = z.object({
  affiliate_code: z.string().min(1, 'Affiliate code is required')
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
    const payload = requestSchema.parse(req.body);

    console.log('[Affiliate Tracking] Received code:', payload.affiliate_code);

    // Find active affiliate
    const { data: affiliates, error: findError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('unique_code', payload.affiliate_code)
      .eq('is_active', true)
      .limit(1);

    if (findError) {
      console.error('[Affiliate Tracking] Query error:', findError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!affiliates || affiliates.length === 0) {
      console.log('[Affiliate Tracking] Affiliate not found');
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    const affiliate = affiliates[0];
    console.log('[Affiliate Tracking] Found:', affiliate.name, 'ID:', affiliate.id);

    // Update referral count
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({
        referral_count: (affiliate.referral_count || 0) + 1
      })
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('[Affiliate Tracking] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update referral count' });
    }

    console.log('[Affiliate Tracking] ✅ Referral tracked');

    return res.status(200).json({
      success: true,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        commission_rate: affiliate.commission_rate
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('[Affiliate Tracking] Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}

