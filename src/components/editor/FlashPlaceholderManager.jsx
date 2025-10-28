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
  isVisible = true,
  injectIntoContent = false
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

  // Inject placeholders into content when placeholders are loaded (only once)
  useEffect(() => {
    if (injectIntoContent && placeholders.length > 0 && content && onContentUpdate) {
      // Check if placeholders are already injected to prevent duplicates
      if (!content.includes('flash-placeholder-container')) {
        injectPlaceholdersIntoContent()
      }
    }
  }, [placeholders, content, injectIntoContent, onContentUpdate])

  // Function to inject placeholders into content
  const injectPlaceholdersIntoContent = () => {
    if (!placeholders.length || !content) return

    let updatedContent = content

    // Sort placeholders by position
    const sortedPlaceholders = [...placeholders].sort((a, b) => a.position - b.position)

    // Group placeholders by type for better distribution
    const imagePlaceholders = sortedPlaceholders.filter(p => p.type === 'image')
    const videoPlaceholders = sortedPlaceholders.filter(p => p.type === 'video')
    const productPlaceholders = sortedPlaceholders.filter(p => p.type === 'product')
    const opinionPlaceholders = sortedPlaceholders.filter(p => p.type === 'opinion')

    // Insert placeholders at different positions to distribute them
    let insertionCount = 0

    // Insert first image after first paragraph
    if (imagePlaceholders.length > 0) {
      const placeholderHtml = createPlaceholderHtml(imagePlaceholders[0], insertionCount++)
      updatedContent = insertAfterFirstParagraph(updatedContent, placeholderHtml)
    }

    // Insert video after second paragraph
    if (videoPlaceholders.length > 0) {
      const placeholderHtml = createPlaceholderHtml(videoPlaceholders[0], insertionCount++)
      updatedContent = insertAfterSecondParagraph(updatedContent, placeholderHtml)
    }

    // Insert second image in middle
    if (imagePlaceholders.length > 1) {
      const placeholderHtml = createPlaceholderHtml(imagePlaceholders[1], insertionCount++)
      updatedContent = insertInMiddle(updatedContent, placeholderHtml)
    }

    // Insert first opinion after third paragraph
    if (opinionPlaceholders.length > 0) {
      const placeholderHtml = createPlaceholderHtml(opinionPlaceholders[0], insertionCount++)
      updatedContent = insertAfterThirdParagraph(updatedContent, placeholderHtml)
    }

    // Insert product section near end
    if (productPlaceholders.length > 0) {
      const placeholderHtml = createPlaceholderHtml(productPlaceholders[0], insertionCount++)
      updatedContent = insertNearEnd(updatedContent, placeholderHtml)
    }

    // Insert remaining opinion placeholders at 80% and 90% of content
    if (opinionPlaceholders.length > 1) {
      const placeholderHtml = createPlaceholderHtml(opinionPlaceholders[1], insertionCount++)
      updatedContent = insertAtPercentage(updatedContent, placeholderHtml, 0.8)
    }

    // Update content if it changed
    if (updatedContent !== content) {
      onContentUpdate(updatedContent)
    }
  }

  // Helper function to create placeholder HTML
  const createPlaceholderHtml = (placeholder, index) => {
    const placeholderId = `flash-${placeholder.type}-${placeholder.id}`
    const glowColor = getPlaceholderColor(placeholder.type)
    
    return `
      <div class="flash-placeholder-container" style="margin: 20px 0; padding: 20px; border: 2px dashed ${glowColor}; border-radius: 12px; background: linear-gradient(135deg, ${glowColor}15, ${glowColor}05); position: relative;">
        <div class="flash-placeholder-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
          <div class="flash-placeholder-icon" style="width: 24px; height: 24px; background: ${glowColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            ${getPlaceholderIcon(placeholder.type)}
          </div>
          <div class="flash-placeholder-title" style="font-weight: 600; color: ${glowColor}; font-size: 16px;">
            ${getPlaceholderTitle(placeholder.type)}
          </div>
          <div class="flash-placeholder-position" style="margin-left: auto; font-size: 12px; color: #666; background: white; padding: 4px 8px; border-radius: 12px;">
            Position ${placeholder.position}
          </div>
        </div>
        <div class="flash-placeholder-content" style="min-height: 80px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 8px; border: 1px solid ${glowColor}30;">
          <div class="flash-placeholder-text" style="text-align: center; color: #666;">
            <div style="font-size: 18px; margin-bottom: 8px;">${getPlaceholderEmoji(placeholder.type)}</div>
            <div style="font-weight: 500; margin-bottom: 4px;">${placeholder.context}</div>
            <div style="font-size: 12px; color: #999;">Click to add ${placeholder.type}</div>
          </div>
        </div>
        <div class="flash-placeholder-actions" style="margin-top: 15px; display: flex; gap: 8px; justify-content: center;">
          <button class="flash-placeholder-btn" style="padding: 8px 16px; background: ${glowColor}; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
            Add ${placeholder.type}
          </button>
          <button class="flash-placeholder-remove" style="padding: 8px 16px; background: #f3f4f6; color: #666; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
            Remove
          </button>
        </div>
      </div>
    `
  }

  // Helper functions for placeholder styling
  const getPlaceholderColor = (type) => {
    const colors = {
      image: '#3B82F6',
      video: '#EF4444', 
      product: '#10B981',
      opinion: '#F59E0B'
    }
    return colors[type] || '#6B7280'
  }

  const getPlaceholderIcon = (type) => {
    const icons = {
      image: '📷',
      video: '🎥',
      product: '🛍️',
      opinion: '💭'
    }
    return icons[type] || '📝'
  }

  const getPlaceholderTitle = (type) => {
    const titles = {
      image: 'Image Placeholder',
      video: 'Video Placeholder', 
      product: 'Product Section',
      opinion: 'Opinion Placeholder'
    }
    return titles[type] || 'Content Placeholder'
  }

  const getPlaceholderEmoji = (type) => {
    const emojis = {
      image: '🖼️',
      video: '🎬',
      product: '🛒',
      opinion: '🗣️'
    }
    return emojis[type] || '📄'
  }

  // Helper functions to insert placeholders at different positions
  const insertAfterFirstParagraph = (content, placeholderHtml) => {
    const paragraphs = content.split('</p>')
    if (paragraphs.length > 1) {
      paragraphs[0] += '</p>' + placeholderHtml
      return paragraphs.join('')
    }
    return content + placeholderHtml
  }

  const insertAfterSecondParagraph = (content, placeholderHtml) => {
    const paragraphs = content.split('</p>')
    if (paragraphs.length > 2) {
      paragraphs[1] += '</p>' + placeholderHtml
      return paragraphs.join('')
    }
    return content + placeholderHtml
  }

  const insertAfterThirdParagraph = (content, placeholderHtml) => {
    const paragraphs = content.split('</p>')
    if (paragraphs.length > 3) {
      paragraphs[2] += '</p>' + placeholderHtml
      return paragraphs.join('')
    }
    return content + placeholderHtml
  }

  const insertInMiddle = (content, placeholderHtml) => {
    const middle = Math.floor(content.length / 2)
    return content.slice(0, middle) + placeholderHtml + content.slice(middle)
  }

  const insertNearEnd = (content, placeholderHtml) => {
    const end = Math.floor(content.length * 0.8)
    return content.slice(0, end) + placeholderHtml + content.slice(end)
  }

  const insertAtPercentage = (content, placeholderHtml, percentage) => {
    const position = Math.floor(content.length * percentage)
    return content.slice(0, position) + placeholderHtml + content.slice(position)
  }

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
