'use client'

import { useState } from 'react'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  folder?: string
}

export default function ImageUpload({ value, onChange, label = 'Image', folder = 'images' }: ImageUploadProps) {
  const [tab, setTab] = useState<'url' | 'upload' | 'ai'>('ai')
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [urlInput, setUrlInput] = useState(value)
  const [aiPrompt, setAiPrompt] = useState('')
  const [enhancePrompt, setEnhancePrompt] = useState(true)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '4:3' | '9:16'>('16:9')
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string }>>([])

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
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          aspect_ratio: aspectRatio,
          num_images: 1,
          enhance_prompt: enhancePrompt,
          folder: folder, // Pass folder to organize images in Supabase Storage
        }),
      })

      const data = await res.json()

      if (data.success && data.images && data.images.length > 0) {
        setGeneratedImages(data.images)
        // Automatically use the first generated image (now optimized WebP from Supabase)
        onChange(data.images[0].url)
        alert('Image generated and optimized successfully!')
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
              <label htmlFor="ai-prompt">Image Prompt</label>
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the image you want to generate... e.g., 'A modern workspace with a laptop showing analytics dashboards, professional lighting, minimalist design'"
                rows={4}
                className="ai-prompt-input"
              />
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

              <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={enhancePrompt}
                    onChange={(e) => setEnhancePrompt(e.target.checked)}
                  />
                  <span>Enhance prompt with quality descriptors</span>
                </label>
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

            {generatedImages.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#28a745', fontWeight: 600 }}>
                  ✓ Image generated successfully!
                </p>
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
          <li><strong>AI Generation:</strong> Describe your image clearly with details like style, mood, and composition</li>
          <li><strong>URL Import:</strong> Works great with Unsplash, Pexels, or any public image URL</li>
          <li><strong>File Upload:</strong> Max 5MB, JPG/PNG recommended</li>
          <li><strong>Best size:</strong> 1200x630px for social sharing</li>
        </ul>
      </div>
    </div>
  )
}
