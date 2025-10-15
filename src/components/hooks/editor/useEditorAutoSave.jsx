import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing auto-save functionality
 * Extracted from Editor.jsx to improve maintainability
 * 
 * @param {Object} params - Auto-save configuration
 * @param {boolean} params.hasUnsavedChanges - Whether there are unsaved changes
 * @param {boolean} params.isSaving - Whether a save is currently in progress
 * @param {boolean} params.isLoading - Whether content is currently loading
 * @param {Object} params.currentUser - Current user object
 * @param {Function} params.saveContent - Function to save content
 * @param {number} params.debounceMs - Debounce time in milliseconds (default: 3000)
 * @returns {Object} Auto-save state and operations
 */
export function useEditorAutoSave({
  hasUnsavedChanges,
  isSaving,
  isLoading,
  currentUser,
  saveContent,
  debounceMs = 3000
}) {
  // ==================== AUTO-SAVE STATE ====================
  const autoSaveTimerRef = useRef(null);
  const lastSaveTimeRef = useRef(null);
  const saveAttemptsRef = useRef(0);
  const maxRetries = 3;

  // ==================== AUTO-SAVE OPERATIONS ====================

  // Clear auto-save timer
  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // Trigger immediate save
  const triggerImmediateSave = useCallback(async () => {
    if (!hasUnsavedChanges || isSaving || isLoading || !currentUser) {
      return false;
    }

    try {
      await saveContent();
      lastSaveTimeRef.current = Date.now();
      saveAttemptsRef.current = 0;
      return true;
    } catch (error) {
      console.error('Auto-save failed:', error);
      saveAttemptsRef.current++;
      return false;
    }
  }, [hasUnsavedChanges, isSaving, isLoading, currentUser, saveContent]);

  // Trigger auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    // Clear existing timer
    clearAutoSaveTimer();

    // Don't auto-save if conditions aren't met
    if (!hasUnsavedChanges || isSaving || isLoading || !currentUser) {
      return;
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveContent();
        lastSaveTimeRef.current = Date.now();
        saveAttemptsRef.current = 0;
      } catch (error) {
        console.error('Auto-save failed:', error);
        saveAttemptsRef.current++;
        
        // Retry if under max attempts
        if (saveAttemptsRef.current < maxRetries) {
          autoSaveTimerRef.current = setTimeout(() => {
            triggerAutoSave();
          }, 2000 * saveAttemptsRef.current); // Exponential backoff
        }
      }
    }, debounceMs);
  }, [hasUnsavedChanges, isSaving, isLoading, currentUser, saveContent, debounceMs, clearAutoSaveTimer]);

  // Force save (bypass debounce)
  const forceSave = useCallback(async () => {
    clearAutoSaveTimer();
    return await triggerImmediateSave();
  }, [clearAutoSaveTimer, triggerImmediateSave]);

  // Get auto-save status
  const getAutoSaveStatus = useCallback(() => {
    return {
      isAutoSaving: autoSaveTimerRef.current !== null,
      lastSaveTime: lastSaveTimeRef.current,
      saveAttempts: saveAttemptsRef.current,
      canAutoSave: hasUnsavedChanges && !isSaving && !isLoading && !!currentUser,
      timeSinceLastSave: lastSaveTimeRef.current ? Date.now() - lastSaveTimeRef.current : null
    };
  }, [hasUnsavedChanges, isSaving, isLoading, currentUser]);

  // Reset auto-save state
  const resetAutoSave = useCallback(() => {
    clearAutoSaveTimer();
    lastSaveTimeRef.current = null;
    saveAttemptsRef.current = 0;
  }, [clearAutoSaveTimer]);

  // ==================== AUTO-SAVE EFFECT ====================
  
  useEffect(() => {
    // If the content is loading, or a save is already in progress, or no user is logged in, don't trigger auto-save.
    // Also, only save if there are actual unsaved changes tracked by the hook.
    if (!hasUnsavedChanges || isSaving || isLoading || !currentUser) {
      clearAutoSaveTimer();
      return;
    }

    // Set auto-save timer
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveContent();
        lastSaveTimeRef.current = Date.now();
        saveAttemptsRef.current = 0;
      } catch (error) {
        console.error('Auto-save failed:', error);
        saveAttemptsRef.current++;
        
        // Retry if under max attempts
        if (saveAttemptsRef.current < maxRetries) {
          autoSaveTimerRef.current = setTimeout(() => {
            triggerAutoSave();
          }, 2000 * saveAttemptsRef.current); // Exponential backoff
        }
      }
    }, debounceMs);

    return () => clearAutoSaveTimer();
  }, [hasUnsavedChanges, isSaving, isLoading, currentUser, saveContent, debounceMs, clearAutoSaveTimer, triggerAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAutoSaveTimer();
    };
  }, [clearAutoSaveTimer]);

  // ==================== RETURN ====================
  return {
    // Auto-save operations
    triggerAutoSave,
    triggerImmediateSave,
    forceSave,
    clearAutoSaveTimer,
    resetAutoSave,
    
    // Auto-save status
    getAutoSaveStatus,
    
    // Auto-save state (for external access if needed)
    autoSaveTimerRef,
    lastSaveTimeRef,
    saveAttemptsRef,
  };
}