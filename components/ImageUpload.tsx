'use client'

import { useState } from 'react'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUpload({ value, onChange, label = 'Image' }: ImageUploadProps) {
  const [tab, setTab] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState(value)

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

  return (
    <div className="image-upload-component">
      <label className="image-upload-label">{label}</label>
      
      <div className="image-upload-tabs">
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
        {tab === 'url' ? (
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
            onClick={() => onChange('')}
            className="btn-remove-image"
          >
            ✕ Remove
          </button>
        </div>
      )}

      <div className="image-upload-tips">
        <p><strong>Recommended:</strong></p>
        <ul>
          <li>Size: 1200x630px (social sharing optimal)</li>
          <li>Format: JPG or PNG</li>
          <li>Max file size: 5MB</li>
          <li>Or use Unsplash URLs directly</li>
        </ul>
      </div>
    </div>
  )
}

