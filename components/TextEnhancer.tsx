'use client'

import { useState } from 'react'

interface TextEnhancerProps {
  value: string
  onChange: (value: string) => void
  fieldType: string
  label?: string
  multiline?: boolean
  rows?: number
}

const LLM_PROVIDERS = {
  openai: {
    name: 'ChatGPT (OpenAI)',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Best Quality)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
    default: 'gpt-4o-mini',
  },
  claude: {
    name: 'Claude (Anthropic)',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Best)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    ],
    default: 'claude-3-5-sonnet-20241022',
  },
  gemini: {
    name: 'Gemini (Google)',
    models: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Best)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
    ],
    default: 'gemini-1.5-flash',
  },
}

export default function TextEnhancer({ 
  value, 
  onChange, 
  fieldType, 
  label, 
  multiline = false,
  rows = 3 
}: TextEnhancerProps) {
  const [enhancing, setEnhancing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [provider, setProvider] = useState<keyof typeof LLM_PROVIDERS>('openai')
  const [model, setModel] = useState(LLM_PROVIDERS.openai.default)
  const [customInstructions, setCustomInstructions] = useState('')

  const handleProviderChange = (newProvider: keyof typeof LLM_PROVIDERS) => {
    setProvider(newProvider)
    setModel(LLM_PROVIDERS[newProvider].default)
  }

  const handleEnhance = async () => {
    if (!value.trim()) {
      alert('Please enter some text first')
      return
    }

    setEnhancing(true)

    try {
      const res = await fetch('/api/enhance-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: value,
          field_type: fieldType,
          provider,
          model,
          custom_instructions: customInstructions,
        }),
      })

      const data = await res.json()

      if (data.success && data.enhanced_text) {
        onChange(data.enhanced_text)
      } else {
        alert(`Failed to enhance text: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Enhancement error:', error)
      alert('Error enhancing text. Check that API keys are configured.')
    } finally {
      setEnhancing(false)
    }
  }

  return (
    <div className="text-enhancer">
      <div className="text-enhancer-header">
        {label && <label className="text-enhancer-label">{label}</label>}
        <div className="text-enhancer-actions">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="btn-text-enhancer-settings"
            title="AI Settings"
          >
            ⚙️
          </button>
          <button
            type="button"
            onClick={handleEnhance}
            disabled={enhancing || !value.trim()}
            className="btn-text-enhancer"
            title="Enhance with AI"
          >
            {enhancing ? '✨ Enhancing...' : '✨ Enhance'}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="text-enhancer-settings">
          <div className="form-row" style={{ gap: '0.5rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor={`provider-${fieldType}`}>AI Provider</label>
              <select
                id={`provider-${fieldType}`}
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as keyof typeof LLM_PROVIDERS)}
                className="text-enhancer-select"
              >
                {Object.entries(LLM_PROVIDERS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor={`model-${fieldType}`}>Model</label>
              <select
                id={`model-${fieldType}`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="text-enhancer-select"
              >
                {LLM_PROVIDERS[provider].models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor={`custom-${fieldType}`}>Custom Instructions (optional)</label>
            <textarea
              id={`custom-${fieldType}`}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., 'Make it more professional' or 'Focus on B2B audience'"
              rows={2}
              className="text-enhancer-instructions"
            />
          </div>
        </div>
      )}

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="text-enhancer-input"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-enhancer-input"
        />
      )}

      <p className="text-enhancer-hint">
        ✨ Click &quot;Enhance&quot; to improve this text with AI • {LLM_PROVIDERS[provider].name}
      </p>
    </div>
  )
}

