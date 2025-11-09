# AI Image Generation with fal.ai Nano Banana

This project integrates fal.ai's Nano Banana endpoint for AI-powered image generation directly in the admin interface.

## 🚀 Performance Optimizations

All generated images are automatically optimized for fast page loading:

- **WebP Format**: Images are generated in WebP format (30-50% smaller than JPEG)
- **Supabase CDN**: Uploaded to Supabase Storage with global CDN delivery
- **Long Cache Headers**: 1-year cache control for maximum browser caching
- **Permanent Hosting**: Images remain accessible indefinitely (not temporary URLs)

This ensures **fast page loads** and **optimal Core Web Vitals** scores.

## Setup

### 1. Get Your fal.ai API Key

1. Go to [fal.ai](https://fal.ai)
2. Sign up or log in
3. Navigate to [Dashboard → API Keys](https://fal.ai/dashboard/keys)
4. Create a new API key
5. Copy the key

### 2. Add API Key to Environment Variables

Add the following to your `.env.local` file:

```bash
FAL_KEY=your_fal_ai_api_key_here
```

### 3. Add to Vercel Environment Variables

For production deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `FAL_KEY`
   - **Value**: Your fal.ai API key
   - **Environments**: Production, Preview, Development
4. Click **Save**
5. Redeploy your project

## Features

### ✨ AI Image Generation

- **Endpoint**: Uses fal.ai's Nano Banana model (Google's state-of-the-art image generation)
- **Location**: Available in all ImageUpload components throughout the admin interface
- **Access**: `/admin/homepage`, `/admin/new`, `/admin/edit/[id]`

### 🎨 Prebuilt Style Presets

Choose from 7 professional style presets for brand consistency:

1. **Custom (No Style)** - Full control, write your own complete prompt
2. **Minimal & Clean** - Perfect for hero images, product shots, professional portraits
3. **Corporate & Professional** - Great for about sections, team pages, business content
4. **Modern & Tech** - Ideal for software, SaaS, tech products, digital services
5. **Creative & Dynamic** - Best for marketing content, blog headers, creative services
6. **Abstract & Background** - Perfect for section backgrounds, banners, hero overlays
7. **Product Showcase** - Excellent for product pages, feature showcases, portfolios

Each preset automatically applies professional photography standards, ensuring consistent, on-brand imagery across your entire website.

### 🎨 Prompt Enhancement

The system automatically enhances your prompts with professional photography keywords like:
- Professional photography
- High quality
- Detailed
- Sharp focus
- Studio lighting
- 8k resolution
- Photorealistic

You can toggle this enhancement on/off when generating images.

### 📐 Aspect Ratios Supported

- **16:9** - Landscape (perfect for hero images, featured images)
- **1:1** - Square (social media, profile images)
- **4:3** - Standard (classic photography ratio)
- **9:16** - Portrait (mobile, vertical layouts)

## Usage

### In Homepage Editor (`/admin/homepage`)

1. Navigate to any image field (Logo, Hero Image, etc.)
2. Click the **"✨ Generate with AI"** tab
3. **Select a Style Preset** (e.g., "Minimal & Clean" for hero images)
4. Enter a **short description**:
   ```
   Example with "Minimal & Clean" preset:
   "Professional working on a laptop"
   
   (The preset automatically adds: minimal design, clean aesthetic, 
   soft lighting, professional photography, white background, etc.)
   ```
5. Select aspect ratio (16:9 recommended for hero images)
6. Optionally check "Extra quality boost" for additional enhancement
7. Click **"✨ Generate Image"**
8. Wait 10-30 seconds for generation
9. Image automatically appears and is ready to use

### In Blog Editor (`/admin/new` or `/admin/edit/[id]`)

Same process as above for Featured Image field.

## Example Prompts with Style Presets

### Using "Minimal & Clean" Preset
**Short prompt:** `Professional working on a laptop`  
**What the preset adds:** minimal design, clean aesthetic, simple composition, soft lighting, professional photography, white background, high quality, 8k resolution  
**Best for:** Hero images, product shots, professional portraits

### Using "Corporate & Professional" Preset
**Short prompt:** `Team meeting in a conference room`  
**What the preset adds:** corporate setting, professional business environment, modern office, clean lines, natural lighting through windows, executive style, high-end photography  
**Best for:** About sections, team pages, business content

### Using "Modern & Tech" Preset
**Short prompt:** `Laptop showing analytics dashboard`  
**What the preset adds:** modern technology aesthetic, sleek design, contemporary style, minimalist tech workspace, ambient lighting, futuristic elements  
**Best for:** Software, SaaS, tech products, digital services

### Using "Creative & Dynamic" Preset
**Short prompt:** `Creative brainstorming session with sticky notes`  
**What the preset adds:** creative composition, dynamic angles, artistic lighting, vibrant but professional, modern design studio aesthetic  
**Best for:** Marketing content, blog headers, creative services

### Using "Abstract & Background" Preset
**Short prompt:** `Blue gradient waves`  
**What the preset adds:** abstract geometric design, gradient backgrounds, modern patterns, soft focus, professional design, clean composition  
**Best for:** Section backgrounds, banners, hero overlays

### Using "Product Showcase" Preset
**Short prompt:** `Wireless headphones on a desk`  
**What the preset adds:** product photography, studio setup, professional lighting, clean background, centered composition, commercial photography  
**Best for:** Product pages, feature showcases, portfolios

### Using "Custom (No Style)" Preset
**Full prompt:** `A professional business meeting in a modern office, diverse team collaborating around a table with laptops, natural lighting through large windows, corporate setting, high quality photography, sharp focus, 8k resolution`  
**What the preset adds:** Nothing - you write the complete prompt  
**Best for:** When you need specific control over every aspect

## API Details

### Request Format

```typescript
POST /api/generate-image

{
  "prompt": "Your image description",
  "aspect_ratio": "16:9",
  "num_images": 1,
  "enhance_prompt": true
}
```

### Response Format

```typescript
{
  "success": true,
  "images": [
    { "url": "https://storage.googleapis.com/..." }
  ],
  "description": "Sure! Here is your image: ",
  "enhanced_prompt": "Your prompt with quality enhancements"
}
```

## Cost & Rate Limits

- **Model**: fal.ai Nano Banana
- **Pricing**: Pay-as-you-go (check [fal.ai pricing](https://fal.ai/pricing))
- **Average cost**: ~$0.01-0.05 per image
- **Generation time**: 10-30 seconds per image
- **Rate limits**: Based on your fal.ai plan

## Best Practices

### ✅ DO:
- Be specific with descriptions
- Include style keywords (modern, minimalist, professional)
- Mention lighting (natural light, studio lighting, soft lighting)
- Specify composition (close-up, wide shot, overhead view)
- Use aspect ratios appropriate for placement (16:9 for heroes)

### ❌ DON'T:
- Use vague prompts like "nice image"
- Generate multiple versions unnecessarily (costs add up)
- Expect instant results (takes 10-30 seconds)
- Use for very specific branded imagery (better to use custom photos)

## Troubleshooting

### Error: "FAL_KEY not configured"

**Solution**: Add `FAL_KEY` to your environment variables (see Setup above)

### Error: "Image generation failed"

**Possible causes**:
1. Invalid API key
2. Rate limit exceeded
3. Prompt contains restricted content
4. fal.ai service issue

**Solution**: Check your API key, wait a few minutes, or try a different prompt

### Images Not Generating

1. Check browser console for errors
2. Verify `FAL_KEY` is set in environment variables
3. Restart your development server after adding the key
4. Check your fal.ai dashboard for API usage/limits

## Alternative: Manual Image Sources

If AI generation isn't working or you prefer manual images:

- **Unsplash**: Free high-quality images (paste URL directly)
- **Pexels**: Free stock photos (paste URL directly)
- **Custom uploads**: Upload your own images (max 5MB)

## Integration Points

The AI image generation is integrated into:

1. **Homepage Editor** (`/admin/homepage`)
   - Logo Image
   - Hero Image
   - Any future image fields

2. **Blog Post Editor** (`/admin/new`, `/admin/edit/[id]`)
   - Featured Image field

3. **Component**: `components/ImageUpload.tsx`
   - Can be reused anywhere in the admin interface

## Future Enhancements

Potential improvements:
- Multiple image generation (select from 2-4 options)
- Image editing/refinement
- Style presets (Corporate, Creative, Minimalist, etc.)
- Saved prompt templates
- Image history/gallery
- Advanced prompt builder UI

## Support

For issues with:
- **fal.ai API**: Contact fal.ai support or check their [documentation](https://docs.fal.ai)
- **Integration code**: Check this documentation or the API route at `app/api/generate-image/route.ts`

