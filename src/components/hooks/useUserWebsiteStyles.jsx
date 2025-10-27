/**
 * useUserWebsiteStyles Hook
 * 
 * Manages user website styles for CSS matching in Flash placeholders.
 * Handles style extraction, storage, and application to placeholders.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export const useUserWebsiteStyles = (userName) => {
  const [userStyles, setUserStyles] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)

  // Load user website styles
  const loadUserStyles = useCallback(async () => {
    if (!userName) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_website_styles')
        .select('*')
        .eq('user_name', userName)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const styles = data[0]
        setUserStyles({
          fontFamily: styles.font_family,
          textColor: styles.text_color,
          accentColor: styles.accent_color,
          backgroundColor: styles.background_color,
          borderColor: styles.border_color,
          borderRadius: styles.border_radius,
          spacing: styles.spacing,
          typography: styles.typography,
          colors: styles.colors,
          extractedAt: styles.created_at
        })
      }
    } catch (error) {
      console.error('Failed to load user styles:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userName])

  // Extract styles from website URL
  const extractStyles = useCallback(async (websiteUrl) => {
    if (!websiteUrl || !userName) return

    setIsExtracting(true)
    try {
      // Call the extract-website-css Edge Function
      const { data, error } = await supabase.functions.invoke('extract-website-css', {
        body: {
          website_url: websiteUrl,
          user_name: userName
        }
      })

      if (error) throw error

      if (data.success) {
        const extractedStyles = data.styles
        setUserStyles(extractedStyles)
        
        // Store in database
        const { error: dbError } = await supabase
          .from('user_website_styles')
          .upsert({
            user_name: userName,
            website_url: websiteUrl,
            font_family: extractedStyles.fontFamily,
            text_color: extractedStyles.textColor,
            accent_color: extractedStyles.accentColor,
            background_color: extractedStyles.backgroundColor,
            border_color: extractedStyles.borderColor,
            border_radius: extractedStyles.borderRadius,
            spacing: extractedStyles.spacing,
            typography: extractedStyles.typography,
            colors: extractedStyles.colors,
            extracted_at: new Date().toISOString()
          })

        if (dbError) throw dbError

        toast.success('Website styles extracted and saved!')
        return true
      } else {
        throw new Error(data.error || 'Failed to extract styles')
      }
    } catch (error) {
      console.error('Failed to extract styles:', error)
      toast.error('Failed to extract website styles')
      return false
    } finally {
      setIsExtracting(false)
    }
  }, [userName])

  // Update specific style properties
  const updateStyle = useCallback(async (styleKey, value) => {
    if (!userName) return

    try {
      const updates = {
        [styleKey]: value,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_website_styles')
        .update(updates)
        .eq('user_name', userName)

      if (error) throw error

      setUserStyles(prev => ({ ...prev, [styleKey]: value }))
      toast.success('Style updated!')
    } catch (error) {
      console.error('Failed to update style:', error)
      toast.error('Failed to update style')
    }
  }, [userName])

  // Reset to default styles
  const resetStyles = useCallback(async () => {
    if (!userName) return

    try {
      const defaultStyles = {
        fontFamily: 'inherit',
        textColor: '#1f2937',
        accentColor: '#3b82f6',
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: '8px',
        spacing: '16px',
        typography: {
          headingFont: 'inherit',
          bodyFont: 'inherit',
          fontSize: '16px',
          lineHeight: '1.6'
        },
        colors: {
          primary: '#3b82f6',
          secondary: '#6b7280',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444'
        }
      }

      const { error } = await supabase
        .from('user_website_styles')
        .upsert({
          user_name: userName,
          ...defaultStyles,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setUserStyles(defaultStyles)
      toast.success('Styles reset to default!')
    } catch (error) {
      console.error('Failed to reset styles:', error)
      toast.error('Failed to reset styles')
    }
  }, [userName])

  // Get CSS variables for placeholder styling
  const getCSSVariables = useCallback(() => {
    return {
      '--flash-font-family': userStyles.fontFamily || 'inherit',
      '--flash-text-color': userStyles.textColor || '#1f2937',
      '--flash-accent-color': userStyles.accentColor || '#3b82f6',
      '--flash-background-color': userStyles.backgroundColor || '#ffffff',
      '--flash-border-color': userStyles.borderColor || '#e5e7eb',
      '--flash-border-radius': userStyles.borderRadius || '8px',
      '--flash-spacing': userStyles.spacing || '16px'
    }
  }, [userStyles])

  // Load styles on mount
  useEffect(() => {
    loadUserStyles()
  }, [loadUserStyles])

  return {
    userStyles,
    isLoading,
    isExtracting,
    loadUserStyles,
    extractStyles,
    updateStyle,
    resetStyles,
    getCSSVariables
  }
}
