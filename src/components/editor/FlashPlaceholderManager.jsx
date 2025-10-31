/**
 * FlashPlaceholderManager Component
 * 
 * Manages the display and interaction of all Flash placeholders in the editor.
 * Handles drag-drop, voice recording, and content uploads.
 */

import React, { useEffect, useState, useCallback } from 'react'
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
  injectIntoContent = false,
  flashStatus = null
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

  // Get neon color scheme for each placeholder type
  const getOrbColorScheme = (type) => {
    const schemes = {
      image: {
        primary: '#00ffff',
        secondary: '#0099ff',
        glow: '#44ffff',
        inner: '#88ffff'
      },
      video: {
        primary: '#ffaa00',
        secondary: '#ff8800',
        glow: '#ffbb44',
        inner: '#ffdd88'
      },
      product: {
        primary: '#00ff00',
        secondary: '#44ff44',
        glow: '#88ff88',
        inner: '#ccffcc'
      },
      opinion: {
        primary: '#ff0088',
        secondary: '#ff0044',
        glow: '#ff44aa',
        inner: '#ff88cc'
      }
    }
    return schemes[type] || schemes.image
  }

  // Helper function to create tiny neon orb HTML matching MateriaOrb style
  const createOrbHtml = (placeholder) => {
    const placeholderId = placeholder.id
    const placeholderType = placeholder.type || placeholder.placeholder_type
    const colors = getOrbColorScheme(placeholderType)
    const baseSize = 16 // Tiny orb size matching Ask AI menu
    
    // Escape context for HTML attribute
    const context = (placeholder.context || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    
    return `
      <span class="flash-orb-placeholder" 
            data-placeholder-id="${placeholderId}" 
            data-placeholder-type="${placeholderType}"
            data-placeholder-position="${placeholder.position || 0}"
            data-placeholder-context="${context}"
            title="${context || placeholderType} placeholder"
            style="
              display: inline-block;
              width: ${baseSize}px;
              height: ${baseSize}px;
              border-radius: 50%;
              background: radial-gradient(circle at 30% 30%, ${colors.inner} 0%, ${colors.primary} 35%, ${colors.secondary} 75%, #000000 100%);
              box-shadow: 
                0 0 ${baseSize * 0.3}px ${colors.glow}cc,
                0 0 ${baseSize * 0.5}px ${colors.glow}88,
                0 0 ${baseSize * 0.8}px ${colors.glow}44,
                inset 0 0 ${baseSize * 0.4}px ${colors.inner}aa,
                inset ${baseSize * 0.12}px ${baseSize * 0.12}px ${baseSize * 0.25}px rgba(255,255,255,0.7);
              position: relative;
              cursor: pointer;
              margin: 0 4px;
              vertical-align: middle;
              animation: flashOrbPulse 3s ease-in-out infinite, flashOrbFloat 4s ease-in-out infinite alternate;
              z-index: 1000;
            "
            onclick="if(window.parent){window.parent.postMessage({type:'flash-orb-click',placeholderId:'${placeholderId}',placeholderType:'${placeholderType}',placeholderData:{id:'${placeholderId}',type:'${placeholderType}',context:'${context}'}},'*');}">
        <span style="
          position: absolute;
          top: 15%;
          left: 20%;
          width: 40%;
          height: 40%;
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%);
          border-radius: 50%;
          animation: flashOrbSparkle 2s ease-in-out infinite alternate;
        "></span>
      </span>
    `
  }

  // Insert orb at strategic position based on placeholder position index
  const insertOrbAtPosition = (content, orbHtml, position, totalPlaceholders) => {
    // Parse position metadata if available
    const positionStr = String(position || '')
    
    // Try to insert after specific paragraph if position indicates it
    if (positionStr.includes('after_paragraph_')) {
      const match = positionStr.match(/after_paragraph_(\d+)/)
      if (match) {
        const paraNum = parseInt(match[1], 10)
        return insertAfterNthParagraph(content, orbHtml, paraNum)
      }
    }
    
    // Default: distribute evenly throughout content
    const percentage = totalPlaceholders > 0 ? (position / totalPlaceholders) : 0.5
    return insertAtPercentage(content, orbHtml, Math.max(0.1, Math.min(0.9, percentage)))
  }

  // Insert after Nth paragraph
  const insertAfterNthParagraph = (content, orbHtml, n) => {
    const paragraphs = content.split(/(<\/p>)/i)
    let paraCount = 0
    let inserted = false
    
    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].match(/<\/p>/i)) {
        paraCount++
        if (paraCount === n && !inserted) {
          paragraphs[i] += ' ' + orbHtml + ' '
          inserted = true
        }
      }
    }
    
    if (!inserted) {
      // Fallback: insert at percentage
      return insertAtPercentage(content, orbHtml, n * 0.2)
    }
    
    return paragraphs.join('')
  }

  // Function to inject tiny neon orbs into content at placeholder positions
  const injectOrbsIntoContent = useCallback(() => {
    if (!placeholders.length || !content) return

    let updatedContent = content

    // Sort placeholders by position
    const sortedPlaceholders = [...placeholders].sort((a, b) => (a.position || 0) - (b.position || 0))

    // Remove any existing orbs first to prevent duplicates
    updatedContent = updatedContent.replace(/<span class="flash-orb-placeholder"[^>]*>[\s\S]*?<\/span>/gi, '')

    // Insert orbs at strategic positions based on placeholder.position
    sortedPlaceholders.forEach((placeholder, index) => {
      const orbHtml = createOrbHtml(placeholder)
      // Insert based on position index - after paragraphs or at strategic points
      updatedContent = insertOrbAtPosition(updatedContent, orbHtml, placeholder.position || index, sortedPlaceholders.length)
    })

    // Update content if it changed
    if (updatedContent !== content) {
      onContentUpdate(updatedContent)
    }
  }, [placeholders, content, onContentUpdate])

  // Inject orbs into content when Flash is completed and placeholders exist
  useEffect(() => {
    if (injectIntoContent && flashStatus === 'completed' && placeholders.length > 0 && content && onContentUpdate) {
      // Check if orbs are already injected to prevent duplicates
      if (!content.includes('flash-orb-placeholder')) {
        injectOrbsIntoContent()
      }
    }
  }, [injectIntoContent, flashStatus, placeholders, content, onContentUpdate, injectOrbsIntoContent])

  // Keep old helper functions for backward compatibility (not used for orbs)
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

  // Hide sidebar when orbs are injected into content
  if (injectIntoContent && flashStatus === 'completed' && placeholders.length > 0) {
    return null // Don't render sidebar, orbs are in content
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
