/**
 * FlashPlaceholder Component
 * 
 * Renders interactive Flash placeholders with drag-drop, voice recording,
 * image/video upload, and product selection functionality.
 */

import React, { useRef } from 'react'
import { 
  Mic, 
  MicOff, 
  Upload, 
  X, 
  GripVertical, 
  Image as ImageIcon, 
  Video, 
  Package, 
  MessageCircle,
  Play,
  Pause,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const FlashPlaceholder = ({ 
  placeholder, 
  onDragStart, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onDragEnd,
  onStartRecording,
  onStopRecording,
  onImageUpload,
  onVideoUpload,
  onProductSelect,
  onDelete,
  isDragging,
  isDragOver,
  isRecording,
  userStyles = {}
}) => {
  const fileInputRef = useRef(null)
  const audioRef = useRef(null)

  const {
    id,
    type: placeholder_type,
    context,
    suggested_content,
    metadata = {},
    recorded_audio,
    uploaded_image,
    uploaded_video,
    selected_product
  } = placeholder

  const {
    image_type = 'photo',
    video_type = 'tutorial',
    duration = 'medium',
    opinion_type = 'personal_experience',
    tone = 'casual',
    priority = 'medium',
    product_type = 'software'
  } = metadata

  // Get placeholder styling based on type
  const getPlaceholderStyles = () => {
    const baseStyles = {
      position: 'relative',
      margin: '20px 0',
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '2px dashed',
      background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
      fontFamily: userStyles.fontFamily || 'inherit'
    }

    const typeStyles = {
      image: {
        borderColor: '#3b82f6',
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        color: '#1e40af'
      },
      video: {
        borderColor: '#f59e0b',
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        color: '#92400e'
      },
      product: {
        borderColor: '#22c55e',
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        color: '#15803d'
      },
      opinion: {
        borderColor: '#ec4899',
        background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
        color: '#be185d'
      }
    }

    return {
      ...baseStyles,
      ...typeStyles[placeholder_type],
      transform: isDragOver ? 'translateY(-2px) scale(1.02)' : 'translateY(0)',
      boxShadow: isDragOver 
        ? '0 8px 20px rgba(0, 0, 0, 0.2)' 
        : '0 4px 12px rgba(0, 0, 0, 0.1)'
    }
  }

  // Get icon based on type
  const getIcon = () => {
    const icons = {
      image: <ImageIcon className="w-12 h-12" />,
      video: <Video className="w-12 h-12" />,
      product: <Package className="w-12 h-12" />,
      opinion: <MessageCircle className="w-12 h-12" />
    }
    return icons[placeholder_type] || <ImageIcon className="w-12 h-12" />
  }

  // Get type-specific content
  const getTypeContent = () => {
    switch (placeholder_type) {
      case 'image':
        return {
          title: 'Insert Image Here',
          description: suggested_content,
          actionText: 'Upload Image',
          actionIcon: <Upload className="w-4 h-4" />
        }
      case 'video':
        return {
          title: 'Insert Video Here',
          description: suggested_content,
          actionText: 'Upload Video',
          actionIcon: <Upload className="w-4 h-4" />
        }
      case 'product':
        return {
          title: 'Promoted Product Section',
          description: suggested_content,
          actionText: 'Select Product',
          actionIcon: <Package className="w-4 h-4" />
        }
      case 'opinion':
        return {
          title: 'Share Your Opinion',
          description: suggested_content,
          actionText: isRecording ? 'Stop Recording' : 'Record Voice',
          actionIcon: isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />
        }
      default:
        return {
          title: 'Insert Content Here',
          description: suggested_content,
          actionText: 'Add Content',
          actionIcon: <Upload className="w-4 h-4" />
        }
    }
  }

  const typeContent = getTypeContent()

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (placeholder_type === 'image') {
      onImageUpload(id, file)
    } else if (placeholder_type === 'video') {
      onVideoUpload(id, file)
    }
  }

  // Handle action button click
  const handleActionClick = () => {
    if (placeholder_type === 'opinion') {
      if (isRecording) {
        onStopRecording()
      } else {
        onStartRecording(id)
      }
    } else if (placeholder_type === 'image' || placeholder_type === 'video') {
      fileInputRef.current?.click()
    } else if (placeholder_type === 'product') {
      // Open product selector modal
      onProductSelect(id, {})
    }
  }

  // Render uploaded content
  const renderUploadedContent = () => {
    if (uploaded_image) {
      return (
        <div className="mt-4">
          <img 
            src={`data:image/jpeg;base64,${uploaded_image}`}
            alt="Uploaded content"
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: '200px' }}
          />
          <div className="mt-2 text-sm text-green-600 flex items-center justify-center gap-1">
            <Check className="w-4 h-4" />
            Image uploaded successfully
          </div>
        </div>
      )
    }

    if (uploaded_video) {
      return (
        <div className="mt-4">
          <video 
            ref={audioRef}
            src={`data:video/mp4;base64,${uploaded_video}`}
            controls
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: '200px' }}
          />
          <div className="mt-2 text-sm text-green-600 flex items-center justify-center gap-1">
            <Check className="w-4 h-4" />
            Video uploaded successfully
          </div>
        </div>
      )
    }

    if (recorded_audio) {
      return (
        <div className="mt-4">
          <audio 
            ref={audioRef}
            src={`data:audio/wav;base64,${recorded_audio}`}
            controls
            className="w-full"
          />
          <div className="mt-2 text-sm text-green-600 flex items-center justify-center gap-1">
            <Check className="w-4 h-4" />
            Voice recording saved
          </div>
        </div>
      )
    }

    if (selected_product && Object.keys(selected_product).length > 0) {
      return (
        <div className="mt-4 p-4 bg-white rounded-lg border">
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <Check className="w-4 h-4" />
            Product selected: {selected_product.name || 'Product'}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div
      className="flash-placeholder"
      style={getPlaceholderStyles()}
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, id)}
      onDragEnd={onDragEnd}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 left-2">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Delete Button */}
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(id)}
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Priority Badge */}
      <div className="absolute top-2 right-8">
        <span className={`text-xs px-2 py-1 rounded ${
          priority === 'high' ? 'bg-red-100 text-red-600' :
          priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {priority.toUpperCase()}
        </span>
      </div>

      {/* Main Content */}
      <div className="opacity-70 mb-4">
        {getIcon()}
      </div>

      <h3 className="text-lg font-semibold mb-2" style={{ color: userStyles.textColor || 'inherit' }}>
        {typeContent.title}
      </h3>

      <p className="text-sm mb-4 opacity-80">
        {typeContent.description}
      </p>

      {/* Context Information */}
      <div className="mb-4 p-3 rounded-lg" style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fontSize: '12px',
        lineHeight: '1.4'
      }}>
        <div className="font-medium mb-1">💡 Why here?</div>
        <div className="opacity-80">{context}</div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleActionClick}
        className="mb-4"
        style={{
          backgroundColor: userStyles.accentColor || '#3b82f6',
          color: 'white',
          border: 'none'
        }}
        disabled={isRecording && recordingPlaceholderId !== id}
      >
        {typeContent.actionIcon}
        <span className="ml-2">{typeContent.actionText}</span>
      </Button>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={placeholder_type === 'image' ? 'image/*' : 'video/*'}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Type and Duration Info */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <span>📏 Drag & drop to move</span>
        <span>•</span>
        <span>{placeholder_type.toUpperCase()}</span>
        {placeholder_type === 'video' && (
          <>
            <span>•</span>
            <span>⏰ {duration.toUpperCase()}</span>
          </>
        )}
        {placeholder_type === 'opinion' && (
          <>
            <span>•</span>
            <span style={{ color: userStyles.accentColor || '#3b82f6' }}>
              {tone.toUpperCase()}
            </span>
          </>
        )}
      </div>

      {/* Uploaded Content */}
      {renderUploadedContent()}
    </div>
  )
}

export default FlashPlaceholder
