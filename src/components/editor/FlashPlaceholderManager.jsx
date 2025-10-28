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

  // Don't inject placeholders into content - just display them
  // useEffect(() => {
  //   if (injectIntoContent && placeholders.length > 0 && content && onContentUpdate) {
  //     // Check if placeholders are already injected to prevent duplicates
  //     if (!content.includes('flash-placeholder-container')) {
  //       injectPlaceholdersIntoContent()
  //     }
  //   }
  // }, [placeholders, content, injectIntoContent, onContentUpdate])

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

    // Insert glowing orbs within the content text at strategic positions
    let insertionCount = 0

    // Insert first image orb after first sentence
    if (imagePlaceholders.length > 0) {
      const placeholderHtml = createPlaceholderHtml(imagePlaceholders[0], insertionCount++)
      updatedContent = insertAfterFirstSentence(updatedContent, placeholderHtml)
    }

    // Insert video orb after second sentence
    if (videoPlaceholders.length > 0) {
      const placeholderHtml = createPlaceholderHtml(videoPlaceholders[0], insertionCount++)
      updatedContent = insertAfterSecondSentence(updatedContent, placeholderHtml)
    }

    // Insert second image orb in middle of content
    if (imagePlaceholders.length > 1) {
      const placeholderHtml = createPlaceholderHtml(imagePlaceholders[1], insertionCount++)
      updatedContent = insertInMiddle(updatedContent, placeholderHtml)
    }

    // Insert first opinion orb after third sentence
    if (opinionPlaceholders.length > 0) {
      const placeholderHtml = createPlaceholderHtml(opinionPlaceholders[0], insertionCount++)
      updatedContent = insertAfterThirdSentence(updatedContent, placeholderHtml)
    }

    // Insert product orb near end
    if (productPlaceholders.length > 0) {
      const placeholderHtml = createPlaceholderHtml(productPlaceholders[0], insertionCount++)
      updatedContent = insertNearEnd(updatedContent, placeholderHtml)
    }

    // Insert remaining opinion orb at 80% of content
    if (opinionPlaceholders.length > 1) {
      const placeholderHtml = createPlaceholderHtml(opinionPlaceholders[1], insertionCount++)
      updatedContent = insertAtPercentage(updatedContent, placeholderHtml, 0.8)
    }

    // Update content if it changed
    if (updatedContent !== content) {
      onContentUpdate(updatedContent)
    }
  }

  // Helper function to create glowing orb placeholder HTML
  const createPlaceholderHtml = (placeholder, index) => {
    const placeholderId = `flash-${placeholder.type}-${placeholder.id}`
    const glowColor = getPlaceholderColor(placeholder.type)
    
    return `
      <span class="flash-orb-placeholder" 
            data-placeholder-id="${placeholderId}" 
            data-type="${placeholder.type}"
            style="
              display: inline-block;
              position: relative;
              margin: 0 8px;
              padding: 8px 12px;
              background: linear-gradient(135deg, ${glowColor}20, ${glowColor}10);
              border: 2px solid ${glowColor};
              border-radius: 20px;
              box-shadow: 0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20;
              color: ${glowColor};
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.3s ease;
              animation: glow-pulse 2s ease-in-out infinite alternate;
            "
            onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 0 30px ${glowColor}60, 0 0 60px ${glowColor}30';"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20';"
            onclick="handlePlaceholderClick('${placeholderId}', '${placeholder.type}')">
        ${getPlaceholderIcon(placeholder.type)} ${getPlaceholderTitle(placeholder.type)}
      </span>
      
      <style>
        @keyframes glow-pulse {
          0% { box-shadow: 0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20; }
          100% { box-shadow: 0 0 30px ${glowColor}60, 0 0 60px ${glowColor}40; }
        }
      </style>
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

  // Helper functions to insert placeholders after sentences
  const insertAfterFirstSentence = (content, placeholderHtml) => {
    const sentences = content.split(/[.!?]+/)
    if (sentences.length > 1) {
      const firstSentence = sentences[0] + content.match(/[.!?]+/)?.[0] || '.'
      const rest = content.substring(firstSentence.length)
      return firstSentence + ' ' + placeholderHtml + ' ' + rest
    }
    return content + ' ' + placeholderHtml
  }

  const insertAfterSecondSentence = (content, placeholderHtml) => {
    const sentences = content.split(/[.!?]+/)
    if (sentences.length > 2) {
      const firstTwoSentences = sentences.slice(0, 2).join('') + content.match(/[.!?]+/)?.[0] || '.'
      const rest = content.substring(firstTwoSentences.length)
      return firstTwoSentences + ' ' + placeholderHtml + ' ' + rest
    }
    return content + ' ' + placeholderHtml
  }

  const insertAfterThirdSentence = (content, placeholderHtml) => {
    const sentences = content.split(/[.!?]+/)
    if (sentences.length > 3) {
      const firstThreeSentences = sentences.slice(0, 3).join('') + content.match(/[.!?]+/)?.[0] || '.'
      const rest = content.substring(firstThreeSentences.length)
      return firstThreeSentences + ' ' + placeholderHtml + ' ' + rest
    }
    return content + ' ' + placeholderHtml
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
