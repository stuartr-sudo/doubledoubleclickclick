// Validate brand specifications
import { createClientFromRequest } from '@/lib/supabase';
import { z } from 'zod';

function isValidHexColor(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

const brandSpecsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  user_name: z.string().min(1, 'User name is required'),
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    text: z.string().optional(),
    background: z.string().optional()
  }).optional(),
  typography: z.object({
    font_family: z.string().optional(),
    font_size_base: z.string().optional()
  }).optional()
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { brandSpecs } = req.body;

    if (!brandSpecs) {
      return res.status(400).json({ error: 'Brand specifications required' });
    }

    const errors = [];

    // Validate with Zod
    try {
      brandSpecsSchema.parse(brandSpecs);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        zodError.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
      }
    }

    // Validate colors
    if (brandSpecs.colors) {
      const colorFields = ['primary', 'secondary', 'accent', 'text', 'background'];
      colorFields.forEach(field => {
        if (brandSpecs.colors[field] && !isValidHexColor(brandSpecs.colors[field])) {
          errors.push(`Invalid hex color for ${field}: ${brandSpecs.colors[field]}`);
        }
      });
    }

    // Validate typography
    if (brandSpecs.typography && brandSpecs.typography.font_size_base) {
      if (!brandSpecs.typography.font_size_base.match(/^\d+(\.\d+)?(px|rem|em)$/)) {
        errors.push('Invalid font size format (must be px, rem, or em)');
      }
    }

    console.log('[Brand Validate] Errors:', errors.length);

    return res.status(200).json({
      success: errors.length === 0,
      errors: errors,
      valid: errors.length === 0
    });

  } catch (error) {
    console.error('[Brand Validate] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Validation failed'
    });
  }
}

