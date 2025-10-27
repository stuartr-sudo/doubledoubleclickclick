/**
 * useFlashPlaceholders Hook
 * 
 * Manages Flash placeholder state, interactions, and database operations.
 * Handles drag-drop, voice recording, image/video uploads, and product management.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export const useFlashPlaceholders = (postId, userName) => {
  const [placeholders, setPlaceholders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverId, setDragOverId] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingPlaceholderId, setRecordingPlaceholderId] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const dragStartRef = useRef(null)

  // Load placeholders from database
  const loadPlaceholders = useCallback(async () => {
    if (!postId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('content_placeholders')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setPlaceholders(data || [])
    } catch (error) {
      console.error('Failed to load placeholders:', error)
      toast.error('Failed to load placeholders')
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  // Update placeholder in database
  const updatePlaceholder = useCallback(async (placeholderId, updates) => {
    try {
      const { error } = await supabase
        .from('content_placeholders')
        .update(updates)
        .eq('id', placeholderId)

      if (error) throw error

      // Update local state
      setPlaceholders(prev => 
        prev.map(p => p.id === placeholderId ? { ...p, ...updates } : p)
      )

      return true
    } catch (error) {
      console.error('Failed to update placeholder:', error)
      toast.error('Failed to update placeholder')
      return false
    }
  }, [])

  // Delete placeholder
  const deletePlaceholder = useCallback(async (placeholderId) => {
    try {
      const { error } = await supabase
        .from('content_placeholders')
        .delete()
        .eq('id', placeholderId)

      if (error) throw error

      // Update local state
      setPlaceholders(prev => prev.filter(p => p.id !== placeholderId))
      toast.success('Placeholder removed')

      return true
    } catch (error) {
      console.error('Failed to delete placeholder:', error)
      toast.error('Failed to delete placeholder')
      return false
    }
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((e, placeholderId) => {
    e.dataTransfer.setData('text/plain', placeholderId)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
    dragStartRef.current = placeholderId
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((e, targetPlaceholderId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(targetPlaceholderId)
  }, [])

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverId(null)
    }
  }, [])

  // Handle drop
  const handleDrop = useCallback(async (e, targetPlaceholderId) => {
    e.preventDefault()
    const draggedPlaceholderId = e.dataTransfer.getData('text/plain')
    
    if (draggedPlaceholderId === targetPlaceholderId) return

    try {
      // Get current placeholder positions
      const draggedPlaceholder = placeholders.find(p => p.id === draggedPlaceholderId)
      const targetPlaceholder = placeholders.find(p => p.id === targetPlaceholderId)
      
      if (!draggedPlaceholder || !targetPlaceholder) return

      // Update positions in database
      await updatePlaceholder(draggedPlaceholderId, { 
        position: targetPlaceholder.position,
        updated_at: new Date().toISOString()
      })

      // Update target placeholder position
      await updatePlaceholder(targetPlaceholderId, { 
        position: draggedPlaceholder.position,
        updated_at: new Date().toISOString()
      })

      toast.success('Placeholder moved')
    } catch (error) {
      console.error('Failed to move placeholder:', error)
      toast.error('Failed to move placeholder')
    } finally {
      setIsDragging(false)
      setDragOverId(null)
      dragStartRef.current = null
    }
  }, [placeholders, updatePlaceholder])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setDragOverId(null)
    dragStartRef.current = null
  }, [])

  // Start voice recording
  const startVoiceRecording = useCallback(async (placeholderId) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Voice recording not supported in this browser')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        
        // Convert to base64 for storage
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1]
          
          // Update placeholder with recorded audio
          await updatePlaceholder(placeholderId, {
            recorded_audio: base64Audio,
            recorded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          toast.success('Voice recording saved!')
        }
        reader.readAsDataURL(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingPlaceholderId(placeholderId)
      toast.success('Recording started...')

    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error('Failed to start recording')
    }
  }, [updatePlaceholder])

  // Stop voice recording
  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingPlaceholderId(null)
      toast.success('Recording stopped')
    }
  }, [isRecording])

  // Handle image upload
  const handleImageUpload = useCallback(async (placeholderId, file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    try {
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1]
        
        await updatePlaceholder(placeholderId, {
          uploaded_image: base64Image,
          image_filename: file.name,
          image_type: file.type,
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        toast.success('Image uploaded successfully!')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast.error('Failed to upload image')
    }
  }, [updatePlaceholder])

  // Handle video upload
  const handleVideoUpload = useCallback(async (placeholderId, file) => {
    if (!file || !file.type.startsWith('video/')) {
      toast.error('Please select a valid video file')
      return
    }

    try {
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Video = reader.result.split(',')[1]
        
        await updatePlaceholder(placeholderId, {
          uploaded_video: base64Video,
          video_filename: file.name,
          video_type: file.type,
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        toast.success('Video uploaded successfully!')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload video:', error)
      toast.error('Failed to upload video')
    }
  }, [updatePlaceholder])

  // Handle product selection
  const handleProductSelection = useCallback(async (placeholderId, productData) => {
    try {
      await updatePlaceholder(placeholderId, {
        selected_product: productData,
        updated_at: new Date().toISOString()
      })

      toast.success('Product selected!')
    } catch (error) {
      console.error('Failed to select product:', error)
      toast.error('Failed to select product')
    }
  }, [updatePlaceholder])

  // Load placeholders on mount
  useEffect(() => {
    loadPlaceholders()
  }, [loadPlaceholders])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])

  return {
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
  }
}
