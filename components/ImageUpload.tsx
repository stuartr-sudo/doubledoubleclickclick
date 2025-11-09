'use client'

import { useState } from 'react'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  folder?: string
  defaultPromptProvider?: keyof typeof LLM_PROVIDERS
  defaultPromptModel?: string
}

// Image style presets for brand consistency
const IMAGE_STYLE_PRESETS = {
  none: {
    name: 'Custom (No Style)',
    suffix: '',
    examples: 'Use your own complete prompt',
  },
  minimal: {
    name: 'Minimal & Clean',
    suffix: 'minimal design, clean aesthetic, simple composition, soft lighting, professional photography, white or light background, high quality, 8k resolution',
    examples: 'Perfect for hero images, product shots, professional portraits',
  },
  corporate: {
    name: 'Corporate & Professional',
    suffix: 'corporate setting, professional business environment, modern office, clean lines, natural lighting through windows, executive style, high-end photography, sharp focus',
    examples: 'Great for about sections, team pages, business content',
  },
  modern: {
    name: 'Modern & Tech',
    suffix: 'modern technology aesthetic, sleek design, contemporary style, minimalist tech workspace, ambient lighting, futuristic elements, clean surfaces, professional tech photography',
    examples: 'Ideal for software, SaaS, tech products, digital services',
  },
  creative: {
    name: 'Creative & Dynamic',
    suffix: 'creative composition, dynamic angles, artistic lighting, vibrant but professional, modern design studio aesthetic, depth of field, editorial photography style',
    examples: 'Best for marketing content, blog headers, creative services',
  },
  abstract: {
    name: 'Abstract & Background',
    suffix: 'abstract geometric design, gradient backgrounds, modern patterns, soft focus, professional design, clean composition, subtle colors, suitable for overlays and backgrounds',
    examples: 'Perfect for section backgrounds, banners, hero overlays',
  },
  product: {
    name: 'Product Showcase',
    suffix: 'product photography, studio setup, professional lighting, clean background, centered composition, commercial photography, high detail, catalog style',
    examples: 'Excellent for product pages, feature showcases, portfolios',
  },
}

// LLM providers for optional prompt enhancement
const LLM_PROVIDERS = {
  openai: {
    name: 'ChatGPT (OpenAI)',
    models: [
      { id: 'gpt-5-2025-08-07', name: 'GPT-5 (Latest)' },
      { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini (Latest)' },
      { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1 (Latest)' },
      { id: 'gpt-4o', name: 'GPT-4o (Best Quality)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Recommended)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fastest)' },
    ],
    default: 'gpt-4o-mini',
  },
  claude: {
    name: 'Claude (Anthropic)',
    models: [
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5 (Latest)' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Best)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    ],
    default: 'claude-3-5-sonnet-20241022',
  },
  gemini: {
    name: 'Gemini (Google)',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Latest)' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Latest)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Best)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
      { id: 'gemini-pro', name: 'Gemini Pro' },
    ],
    default: 'gemini-1.5-flash',
  },
}

export default function ImageUpload({ value, onChange, label = 'Image', folder = 'images', defaultPromptProvider, defaultPromptModel }: ImageUploadProps) {
  const [tab, setTab] = useState<'url' | 'upload' | 'ai'>('ai')
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [urlInput, setUrlInput] = useState(value)
  const [aiPrompt, setAiPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<keyof typeof IMAGE_STYLE_PRESETS>('minimal')
  const [enhancePrompt, setEnhancePrompt] = useState(false) // Disabled by default when using style presets
  const [promptProvider, setPromptProvider] = useState<keyof typeof LLM_PROVIDERS>(defaultPromptProvider || 'openai')
  const [promptModel, setPromptModel] = useState<string>(defaultPromptModel || LLM_PROVIDERS[defaultPromptProvider || 'openai'].default)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '4:3' | '9:16'>('16:9')
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string }>>([])

  const handleProviderChange = (prov: keyof typeof LLM_PROVIDERS) => {
    setPromptProvider(prov)
    setPromptModel(LLM_PROVIDERS[prov].default)
  }

  const handleUrlSubmit = () => {
    onChange(urlInput)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        onChange(data.url)
        alert('Image uploaded successfully!')
      } else {
        alert('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    setGenerating(true)
    setGeneratedImages([])

    try {
      // Build the final prompt with style preset
      let finalPrompt = aiPrompt
      const stylePreset = IMAGE_STYLE_PRESETS[selectedStyle]
      if (stylePreset.suffix) {
        finalPrompt = `${aiPrompt}, ${stylePreset.suffix}`
      }

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspect_ratio: aspectRatio,
          num_images: 1,
          enhance_prompt: enhancePrompt, // Additional enhancement on top of style preset
          prompt_provider: promptProvider,
          prompt_model: promptModel,
          folder: folder, // Pass folder to organize images in Supabase Storage
        }),
      })

      const data = await res.json()

      if (data.success && data.images && data.images.length > 0) {
        setGeneratedImages(data.images)
        // Automatically use the first generated image (now optimized WebP from Supabase)
        onChange(data.images[0].url)
      } else {
        alert(`Failed to generate image: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('Error generating image')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="image-upload-component">
      <label className="image-upload-label">{label}</label>
      
      <div className="image-upload-tabs">
        <button
          type="button"
          className={`tab-btn ${tab === 'ai' ? 'active' : ''}`}
          onClick={() => setTab('ai')}
        >
          ✨ Generate with AI
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'url' ? 'active' : ''}`}
          onClick={() => setTab('url')}
        >
          From URL
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'upload' ? 'active' : ''}`}
          onClick={() => setTab('upload')}
        >
          Upload File
        </button>
      </div>

      <div className="image-upload-content">
        {tab === 'ai' ? (
          <div className="ai-generation-group">
            <div className="form-group">
              <label htmlFor="image-style">Image Style Preset</label>
              <select
                id="image-style"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as keyof typeof IMAGE_STYLE_PRESETS)}
                className="aspect-ratio-select"
                style={{ marginBottom: '0.5rem' }}
              >
                {Object.entries(IMAGE_STYLE_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem', fontStyle: 'italic' }}>
                {IMAGE_STYLE_PRESETS[selectedStyle].examples}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="ai-prompt">What do you want to see?</label>
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={
                  selectedStyle === 'none' 
                    ? "Full prompt: e.g., 'A modern workspace with a laptop showing analytics dashboards, professional lighting, minimalist design'"
                    : "Short description: e.g., 'A professional working on a laptop' or 'Team collaborating in a meeting room'"
                }
                rows={3}
                className="ai-prompt-input"
              />
              <p style={{ fontSize: '0.75rem', color: '#28a745', marginTop: '0.5rem' }}>
                {selectedStyle !== 'none' && (
                  <>
                    <strong>✓ Style applied:</strong> {IMAGE_STYLE_PRESETS[selectedStyle].suffix.split(',').slice(0, 3).join(',')}...
                  </>
                )}
              </p>
            </div>

            <div className="form-row" style={{ gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="aspect-ratio">Aspect Ratio</label>
                <select
                  id="aspect-ratio"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="aspect-ratio-select"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:3">4:3 (Standard)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={enhancePrompt}
                    onChange={(e) => setEnhancePrompt(e.target.checked)}
                  />
                  <span>Use AI to enhance prompt</span>
                </label>
                {enhancePrompt && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <select
                      value={promptProvider}
                      onChange={(e) => handleProviderChange(e.target.value as keyof typeof LLM_PROVIDERS)}
                      className="aspect-ratio-select"
                    >
                      {Object.entries(LLM_PROVIDERS).map(([key, p]) => (
                        <option key={key} value={key}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={promptModel}
                      onChange={(e) => setPromptModel(e.target.value)}
                      className="aspect-ratio-select"
                    >
                      {LLM_PROVIDERS[promptProvider].models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateImage}
              disabled={generating || !aiPrompt.trim()}
              className="btn btn-primary"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {generating ? '✨ Generating...' : '✨ Generate Image'}
            </button>

            {generating && (
              <div className="upload-status" style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p>🎨 Creating your image with AI...</p>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>This may take 10-30 seconds</p>
              </div>
            )}

          </div>
        ) : tab === 'url' ? (
          <div className="url-input-group">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg or paste Unsplash URL"
              className="url-input"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="btn btn-sm btn-primary"
            >
              Use URL
            </button>
          </div>
        ) : (
          <div className="file-upload-group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="file-input"
            />
            {uploading && <p className="upload-status">Uploading...</p>}
          </div>
        )}
      </div>

      {value && (
        <div className="image-upload-preview">
          <img src={value} alt="Preview" />
          <button
            type="button"
            onClick={() => {
              onChange('')
              setGeneratedImages([])
            }}
            className="btn-remove-image"
          >
            ✕ Remove
          </button>
        </div>
      )}

      <div className="image-upload-tips">
        <p><strong>Tips:</strong></p>
        <ul>
          <li><strong>Style Presets:</strong> Choose a preset for consistent, on-brand images across your site</li>
          <li><strong>Short Descriptions:</strong> With presets, you only need to describe the subject (e.g., &quot;laptop on desk&quot;)</li>
          <li><strong>Custom Style:</strong> Select &quot;Custom&quot; to write your own complete prompt</li>
          <li><strong>Best Results:</strong> Minimal & Clean for heroes, Corporate for team pages, Modern for tech content</li>
        </ul>
      </div>
    </div>
  )
}
