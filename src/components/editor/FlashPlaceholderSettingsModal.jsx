/**
 * FlashPlaceholderSettingsModal Component
 * 
 * Modal for managing Flash placeholder settings, styles, and preferences.
 * Allows users to extract website styles and customize placeholder appearance.
 */

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserWebsiteStyles } from '@/components/hooks/useUserWebsiteStyles'
import { 
  Palette, 
  Globe, 
  RefreshCw, 
  Download, 
  Upload, 
  Settings as SettingsIcon,
  Eye,
  Code
} from 'lucide-react'
import { toast } from 'sonner'

const FlashPlaceholderSettingsModal = ({ 
  isOpen, 
  onClose, 
  userName,
  onStylesUpdate 
}) => {
  const {
    userStyles,
    isLoading,
    isExtracting,
    extractStyles,
    updateStyle,
    resetStyles,
    getCSSVariables
  } = useUserWebsiteStyles(userName)

  const [websiteUrl, setWebsiteUrl] = useState('')
  const [activeTab, setActiveTab] = useState('extract')
  const [previewMode, setPreviewMode] = useState('visual')

  // Handle style extraction
  const handleExtractStyles = async () => {
    if (!websiteUrl.trim()) {
      toast.error('Please enter a website URL')
      return
    }

    const success = await extractStyles(websiteUrl.trim())
    if (success) {
      onStylesUpdate(userStyles)
    }
  }

  // Handle style update
  const handleStyleUpdate = async (key, value) => {
    await updateStyle(key, value)
    onStylesUpdate({ ...userStyles, [key]: value })
  }

  // Handle style reset
  const handleResetStyles = async () => {
    await resetStyles()
    onStylesUpdate(userStyles)
  }

  // Export styles as CSS
  const handleExportStyles = () => {
    const cssVariables = getCSSVariables()
    const cssString = Object.entries(cssVariables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')

    const fullCSS = `:root {\n${cssString}\n}\n\n/* Flash Placeholder Styles */\n.flash-placeholder {\n  font-family: var(--flash-font-family);\n  color: var(--flash-text-color);\n  background-color: var(--flash-background-color);\n  border-color: var(--flash-border-color);\n  border-radius: var(--flash-border-radius);\n  padding: var(--flash-spacing);\n}\n\n.flash-placeholder .accent {\n  color: var(--flash-accent-color);\n}`

    const blob = new Blob([fullCSS], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flash-placeholder-styles.css'
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Styles exported as CSS file!')
  }

  // Import styles from CSS
  const handleImportStyles = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const css = e.target.result
        // Parse CSS variables (simplified)
        const variables = {}
        const matches = css.matchAll(/--flash-([^:]+):\s*([^;]+);/g)
        
        for (const match of matches) {
          const key = match[1].replace(/-([a-z])/g, (g) => g[1].toUpperCase())
          variables[key] = match[2].trim()
        }

        // Update styles
        Object.entries(variables).forEach(([key, value]) => {
          updateStyle(key, value)
        })

        toast.success('Styles imported successfully!')
      } catch (error) {
        console.error('Failed to parse CSS:', error)
        toast.error('Failed to parse CSS file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Flash Placeholder Settings
          </DialogTitle>
          <DialogDescription>
            Customize the appearance and behavior of Flash placeholders to match your website's design.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="extract" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Extract Styles
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Customize
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export/Import
            </TabsTrigger>
          </TabsList>

          {/* Extract Styles Tab */}
          <TabsContent value="extract" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="website-url">Website URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="website-url"
                    placeholder="https://yourwebsite.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleExtractStyles}
                    disabled={isExtracting || !websiteUrl.trim()}
                  >
                    {isExtracting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Extract
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your website URL to automatically extract colors, fonts, and styling.
                </p>
              </div>

              {userStyles.extractedAt && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ Styles extracted on {new Date(userStyles.extractedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Customize Tab */}
          <TabsContent value="customize" className="space-y-4">
            <div className="space-y-4">
              {/* Font Family */}
              <div>
                <Label htmlFor="font-family">Font Family</Label>
                <Input
                  id="font-family"
                  value={userStyles.fontFamily || ''}
                  onChange={(e) => handleStyleUpdate('fontFamily', e.target.value)}
                  placeholder="e.g., 'Inter', sans-serif"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="text-color"
                      type="color"
                      value={userStyles.textColor || '#1f2937'}
                      onChange={(e) => handleStyleUpdate('textColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={userStyles.textColor || '#1f2937'}
                      onChange={(e) => handleStyleUpdate('textColor', e.target.value)}
                      placeholder="#1f2937"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="accent-color"
                      type="color"
                      value={userStyles.accentColor || '#3b82f6'}
                      onChange={(e) => handleStyleUpdate('accentColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={userStyles.accentColor || '#3b82f6'}
                      onChange={(e) => handleStyleUpdate('accentColor', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Background and Border */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="background-color">Background Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="background-color"
                      type="color"
                      value={userStyles.backgroundColor || '#ffffff'}
                      onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={userStyles.backgroundColor || '#ffffff'}
                      onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="border-color">Border Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="border-color"
                      type="color"
                      value={userStyles.borderColor || '#e5e7eb'}
                      onChange={(e) => handleStyleUpdate('borderColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={userStyles.borderColor || '#e5e7eb'}
                      onChange={(e) => handleStyleUpdate('borderColor', e.target.value)}
                      placeholder="#e5e7eb"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Border Radius and Spacing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="border-radius">Border Radius</Label>
                  <Input
                    id="border-radius"
                    value={userStyles.borderRadius || '8px'}
                    onChange={(e) => handleStyleUpdate('borderRadius', e.target.value)}
                    placeholder="8px"
                  />
                </div>

                <div>
                  <Label htmlFor="spacing">Spacing</Label>
                  <Input
                    id="spacing"
                    value={userStyles.spacing || '16px'}
                    onChange={(e) => handleStyleUpdate('spacing', e.target.value)}
                    placeholder="16px"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleResetStyles} variant="outline">
                  Reset to Default
                </Button>
                <Button onClick={() => onStylesUpdate(userStyles)}>
                  Apply Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Export/Import Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Export Styles</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Export your Flash placeholder styles as a CSS file for use in other projects.
                </p>
                <Button onClick={handleExportStyles} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSS File
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Import Styles</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Import styles from a previously exported CSS file.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".css"
                    onChange={handleImportStyles}
                    className="flex-1"
                  />
                  <Button variant="outline">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Preview CSS Variables</h4>
                <div className="flex gap-2 mb-2">
                  <Button
                    variant={previewMode === 'visual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('visual')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Visual
                  </Button>
                  <Button
                    variant={previewMode === 'code' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('code')}
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Code
                  </Button>
                </div>
                
                {previewMode === 'code' ? (
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {Object.entries(getCSSVariables())
                      .map(([key, value]) => `${key}: ${value};`)
                      .join('\n')}
                  </pre>
                ) : (
                  <div className="p-4 border rounded-lg" style={getCSSVariables()}>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Palette className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold">Sample Placeholder</h3>
                      <p className="text-sm opacity-80">This is how your placeholders will look</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FlashPlaceholderSettingsModal
