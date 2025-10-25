import React, { useState, useEffect } from 'react';
import { LlmSettings } from '../api/entities';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw, TrendingUp, Zap } from 'lucide-react';

export default function AdminLLMSettings() {
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await LlmSettings.list('-created_date');
      setSettings(data || []);
    } catch (error) {
      console.error('Failed to load LLM settings:', error);
      toast.error('Failed to load settings');
    }
    setIsLoading(false);
  };

  const startEditing = (setting) => {
    setEditingId(setting.id);
    setEditForm({ ...setting });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    try {
      await LlmSettings.update(editingId, editForm);
      toast.success('Settings updated successfully!');
      setEditingId(null);
      setEditForm({});
      loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LLM Settings</h1>
        <p className="text-gray-600">
          Configure AI models, prompts, and parameters for each feature. Changes take effect immediately.
        </p>
      </div>

      {/* Settings List */}
      <div className="space-y-6">
        {settings.map((setting) => {
          const isEditing = editingId === setting.id;
          const data = isEditing ? editForm : setting;

          return (
            <div
              key={setting.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {data.display_name}
                  </h2>
                  <p className="text-sm text-gray-600">{data.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Used {setting.usage_count || 0} times
                    </span>
                    {setting.last_used_date && (
                      <span>
                        Last used: {new Date(setting.last_used_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => startEditing(setting)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  {isEditing ? (
                    <select
                      value={data.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
                      <option value="gpt-4o">GPT-4o (Powerful)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-mono text-sm">
                      {data.model}
                    </div>
                  )}
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {data.temperature}
                  </label>
                  {isEditing ? (
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={data.temperature}
                      onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  ) : (
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(data.temperature / 2) * 100}%` }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="10"
                      max="4000"
                      value={data.max_tokens}
                      onChange={(e) => handleInputChange('max_tokens', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 font-mono text-sm">
                      {data.max_tokens}
                    </div>
                  )}
                </div>

                {/* Enabled Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  {isEditing ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.is_enabled}
                        onChange={(e) => handleInputChange('is_enabled', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {data.is_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  ) : (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      data.is_enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {data.is_enabled ? '✓ Enabled' : '✗ Disabled'}
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Parameters (Collapsible in edit mode) */}
              {isEditing && (
                <details className="mb-6">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Advanced Parameters
                  </summary>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Top P
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={data.top_p || 1}
                        onChange={(e) => handleInputChange('top_p', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency Penalty
                      </label>
                      <input
                        type="number"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={data.frequency_penalty || 0}
                        onChange={(e) => handleInputChange('frequency_penalty', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Presence Penalty
                      </label>
                      <input
                        type="number"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={data.presence_penalty || 0}
                        onChange={(e) => handleInputChange('presence_penalty', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </details>
              )}

              {/* System Prompt */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                {isEditing ? (
                  <textarea
                    value={data.system_prompt}
                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="System instructions for the AI..."
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap font-mono">
                    {data.system_prompt}
                  </div>
                )}
              </div>

              {/* User Prompt Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Prompt Template
                  <span className="ml-2 text-xs text-gray-500">
                    (Use {{'{'}variable{'}'}} for placeholders)
                  </span>
                </label>
                {isEditing ? (
                  <textarea
                    value={data.user_prompt_template || ''}
                    onChange={(e) => handleInputChange('user_prompt_template', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Prompt template with {{title}} and {{content}} variables..."
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap font-mono">
                    {data.user_prompt_template || '(none)'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {settings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No LLM settings configured yet.
        </div>
      )}
    </div>
  );
}

