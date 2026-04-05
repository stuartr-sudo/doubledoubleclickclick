'use client'

import { useProvisionContext } from '../ProvisionContext'

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function AuthorStep() {
  const { state, dispatch } = useProvisionContext()

  const updateField = (field: keyof typeof state, value: typeof state[keyof typeof state]) => {
    dispatch({ type: 'SET_FIELD', field, value })
  }

  const updateSocial = (index: number, value: string) => {
    const updated = state.authorSocials.map((v, i) => (i === index ? value : v))
    updateField('authorSocials', updated)
  }

  const addSocial = () => {
    updateField('authorSocials', [...state.authorSocials, ''])
  }

  const removeSocial = (index: number) => {
    if (state.authorSocials.length <= 1) return
    updateField(
      'authorSocials',
      state.authorSocials.filter((_, i) => i !== index),
    )
  }

  return (
    <div className="dc-card">
      <div className="dc-card-header">
        <h3>Author</h3>
      </div>
      <div className="dc-card-body">
        <div className="dc-field-row">
          <div className="dc-field">
            <label>Author Name</label>
            <input
              type="text"
              value={state.authorName}
              onChange={(e) => updateField('authorName', e.target.value)}
              placeholder={
                state.displayName
                  ? `${state.displayName} Editorial`
                  : 'Author name'
              }
            />
          </div>
          <div className="dc-field">
            <label>Author Image URL</label>
            <input
              type="url"
              value={state.authorImageUrl}
              onChange={(e) => updateField('authorImageUrl', e.target.value)}
              placeholder="https://.../author.jpg"
            />
          </div>
        </div>

        <div className="dc-field">
          <label>Author Page URL</label>
          <input
            type="url"
            value={state.authorPageUrl}
            onChange={(e) => updateField('authorPageUrl', e.target.value)}
            placeholder="https://yoursite.com/author/name"
          />
        </div>

        <div className="dc-field">
          <label>Author Bio</label>
          <textarea
            value={state.authorBio}
            onChange={(e) => updateField('authorBio', e.target.value)}
            placeholder="1-3 sentences about the author"
            rows={2}
          />
        </div>

        <div className="dc-field">
          <label>Author Social Profile URLs</label>
          {state.authorSocials.map((url, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <input
                type="url"
                value={url}
                onChange={(e) => updateSocial(i, e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                className="dc-list-input"
                style={{ flex: 1 }}
              />
              {state.authorSocials.length > 1 && (
                <button
                  type="button"
                  className="dc-btn-link"
                  onClick={() => removeSocial(i)}
                  style={{ color: '#ef4444', whiteSpace: 'nowrap' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="dc-btn-link" onClick={addSocial}>
            + Add another
          </button>
        </div>
      </div>
    </div>
  )
}
