/**
 * FlashPlaceholderManager Component
 * 
 * Manages the display and interaction of all Flash placeholders in the editor.
 * Handles drag-drop, voice recording, and content uploads.
 */

import React, { useEffect, useState } from 'react'
import { useFlashPlaceholders } from '@/components/hooks/useFlashPlaceholders'
import FlashPlaceholder from './FlashPlaceholder'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'

const FlashPlaceholderManager = ({ 
  postId, 
  userName, 
  content, 
  onContentUpdate,
  userStyles = {},
  isVisible = true 
}) => {
  const {
    placeholders,
    isLoading,
    isDragging,
    dragOverId,
    isRecording,
    recordingPlaceholderId,
    loadPlaceholders,
    updatePlaceholder,
    deletePlaceholder,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    startVoiceRecording,
    stopVoiceRecording,
    handleImageUpload,
    handleVideoUpload,
    handleProductSelection
  } = useFlashPlaceholders(postId, userName)

  const [showSettings, setShowSettings] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh placeholders when content changes
  useEffect(() => {
    if (autoRefresh && content) {
      const timer = setTimeout(() => {
        loadPlaceholders()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [content, autoRefresh, loadPlaceholders])

  // Group placeholders by type
  const groupedPlaceholders = placeholders.reduce((acc, placeholder) => {
    const type = placeholder.type
    if (!acc[type]) acc[type] = []
    acc[type].push(placeholder)
    return acc
  }, {})

  // Get placeholder counts
  const placeholderCounts = {
    image: groupedPlaceholders.image?.length || 0,
    video: groupedPlaceholders.video?.length || 0,
    product: groupedPlaceholders.product?.length || 0,
    opinion: groupedPlaceholders.opinion?.length || 0
  }

  const totalPlaceholders = placeholders.length

  // Handle placeholder deletion
  const handleDeletePlaceholder = async (placeholderId) => {
    const success = await deletePlaceholder(placeholderId)
    if (success) {
      // Remove placeholder from content
      const updatedContent = content.replace(
        new RegExp(`<div class="flash-${placeholderId.split('-')[1]}-placeholder"[^>]*>.*?</div>`, 'gs'),
        ''
      )
      onContentUpdate(updatedContent)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    loadPlaceholders()
    toast.success('Placeholders refreshed')
  }

  // Handle add new placeholder
  const handleAddPlaceholder = (type) => {
    // This would typically open a modal to create a new placeholder
    toast.info(`Add ${type} placeholder functionality coming soon`)
  }

  if (!isVisible) return null

  return (
    <div className="flash-placeholder-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Flash Placeholders</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Images: {placeholderCounts.image}</span>
            <span>•</span>
            <span>Videos: {placeholderCounts.video}</span>
            <span>•</span>
            <span>Products: {placeholderCounts.product}</span>
            <span>•</span>
            <span>Opinions: {placeholderCounts.opinion}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-refresh placeholders</span>
            </label>
          </div>
        </div>
      )}

      {/* Placeholders Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading placeholders...</span>
        </div>
      ) : totalPlaceholders === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No Flash placeholders found for this content.</p>
          <p className="text-sm mt-2">Enable Flash AI Enhancement to generate placeholders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Images */}
          {groupedPlaceholders.image?.map(placeholder => (
            <FlashPlaceholder
              key={placeholder.id}
              placeholder={placeholder}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onStartRecording={startVoiceRecording}
              onStopRecording={stopVoiceRecording}
              onImageUpload={handleImageUpload}
              onVideoUpload={handleVideoUpload}
              onProductSelect={handleProductSelection}
              onDelete={handleDeletePlaceholder}
              isDragging={isDragging}
              isDragOver={dragOverId === placeholder.id}
              isRecording={isRecording}
              recordingPlaceholderId={recordingPlaceholderId}
              userStyles={userStyles}
            />
          ))}

          {/* Videos */}
          {groupedPlaceholders.video?.map(placeholder => (
            <FlashPlaceholder
              key={placeholder.id}
              placeholder={placeholder}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onStartRecording={startVoiceRecording}
              onStopRecording={stopVoiceRecording}
              onImageUpload={handleImageUpload}
              onVideoUpload={handleVideoUpload}
              onProductSelect={handleProductSelection}
              onDelete={handleDeletePlaceholder}
              isDragging={isDragging}
              isDragOver={dragOverId === placeholder.id}
              isRecording={isRecording}
              recordingPlaceholderId={recordingPlaceholderId}
              userStyles={userStyles}
            />
          ))}

          {/* Products */}
          {groupedPlaceholders.product?.map(placeholder => (
            <FlashPlaceholder
              key={placeholder.id}
              placeholder={placeholder}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onStartRecording={startVoiceRecording}
              onStopRecording={stopVoiceRecording}
              onImageUpload={handleImageUpload}
              onVideoUpload={handleVideoUpload}
              onProductSelect={handleProductSelection}
              onDelete={handleDeletePlaceholder}
              isDragging={isDragging}
              isDragOver={dragOverId === placeholder.id}
              isRecording={isRecording}
              recordingPlaceholderId={recordingPlaceholderId}
              userStyles={userStyles}
            />
          ))}

          {/* Opinions */}
          {groupedPlaceholders.opinion?.map(placeholder => (
            <FlashPlaceholder
              key={placeholder.id}
              placeholder={placeholder}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onStartRecording={startVoiceRecording}
              onStopRecording={stopVoiceRecording}
              onImageUpload={handleImageUpload}
              onVideoUpload={handleVideoUpload}
              onProductSelect={handleProductSelection}
              onDelete={handleDeletePlaceholder}
              isDragging={isDragging}
              isDragOver={dragOverId === placeholder.id}
              isRecording={isRecording}
              recordingPlaceholderId={recordingPlaceholderId}
              userStyles={userStyles}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {totalPlaceholders > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              <p className="font-medium">💡 Tips:</p>
              <ul className="mt-1 space-y-1">
                <li>• Drag placeholders to reorder them</li>
                <li>• Click action buttons to add content</li>
                <li>• Use voice recording for opinion placeholders</li>
                <li>• Upload images and videos directly</li>
              </ul>
            </div>
            
            <div className="text-sm text-blue-600">
              {totalPlaceholders} placeholder{totalPlaceholders !== 1 ? 's' : ''} total
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlashPlaceholderManager
