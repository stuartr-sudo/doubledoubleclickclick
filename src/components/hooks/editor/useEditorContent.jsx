import { useState, useEffect, useCallback, useRef } from 'react';
import { BlogPost } from '@/api/entities';
import { WebhookReceived } from '@/api/entities';
import { toast } from 'sonner';

/**
 * Custom hook for managing editor content state and operations
 * Extracted from Editor.jsx to improve maintainability
 * 
 * @param {string} postId - The ID of the post to load (from URL params)
 * @param {string} webhookId - The ID of the webhook content to load (from URL params)
 * @returns {Object} Content state and operations
 */
export function useEditorContent(postId, webhookId) {
  // ==================== STATE ====================
  const [post, setPost] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track initial content to detect changes
  const initialContentRef = useRef('');
  const initialTitleRef = useRef('');
  const saveTimeoutRef = useRef(null);

  // ==================== LOAD POST ====================
  const loadPost = useCallback(async () => {
    setIsLoading(true);
    try {
      if (postId) {
        // Load from BlogPost entity
        const posts = await BlogPost.filter({ id: postId });
        if (posts && posts.length > 0) {
          const loadedPost = posts[0];
          setPost(loadedPost);
          setContent(loadedPost.content || '');
          setTitle(loadedPost.title || '');
          initialContentRef.current = loadedPost.content || '';
          initialTitleRef.current = loadedPost.title || '';
          setLastSaved(loadedPost.updated_date || loadedPost.created_date);
        } else {
          toast.error('Post not found');
        }
      } else if (webhookId) {
        // Load from WebhookReceived entity
        const webhooks = await WebhookReceived.filter({ id: webhookId });
        if (webhooks && webhooks.length > 0) {
          const loadedWebhook = webhooks[0];
          setPost(loadedWebhook);
          setContent(loadedWebhook.content || '');
          setTitle(loadedWebhook.title || '');
          initialContentRef.current = loadedWebhook.content || '';
          initialTitleRef.current = loadedWebhook.title || '';
          setLastSaved(loadedWebhook.updated_date || loadedWebhook.created_date);
        } else {
          toast.error('Webhook content not found');
        }
      } else {
        // New post mode
        setPost(null);
        setContent('');
        setTitle('');
        initialContentRef.current = '';
        initialTitleRef.current = '';
      }
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [postId, webhookId]);

  // ==================== SAVE CONTENT ====================
  const saveContent = useCallback(async (contentToSave = content, titleToSave = title) => {
    if (!postId && !webhookId) {
      toast.error('Cannot save: No post or webhook ID');
      return;
    }

    setIsSaving(true);
    try {
      if (postId) {
        // Update BlogPost
        await BlogPost.update(postId, {
          content: contentToSave,
          title: titleToSave,
        });
        
        // Update initial refs to mark as saved
        initialContentRef.current = contentToSave;
        initialTitleRef.current = titleToSave;
        setHasUnsavedChanges(false);
        setLastSaved(new Date().toISOString());
        
        // Refresh post object
        const posts = await BlogPost.filter({ id: postId });
        if (posts && posts.length > 0) {
          setPost(posts[0]);
        }
      } else if (webhookId) {
        // Update WebhookReceived
        await WebhookReceived.update(webhookId, {
          content: contentToSave,
          title: titleToSave,
        });
        
        // Update initial refs to mark as saved
        initialContentRef.current = contentToSave;
        initialTitleRef.current = titleToSave;
        setHasUnsavedChanges(false);
        setLastSaved(new Date().toISOString());
        
        // Refresh webhook object
        const webhooks = await WebhookReceived.filter({ id: webhookId });
        if (webhooks && webhooks.length > 0) {
          setPost(webhooks[0]);
        }
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  }, [content, title, postId, webhookId]);

  // ==================== CONTENT CHANGE HANDLER ====================
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    
    // Check if content has changed from initial
    const hasChanged = newContent !== initialContentRef.current || 
                       title !== initialTitleRef.current;
    setHasUnsavedChanges(hasChanged);
  }, [title]);

  // ==================== TITLE CHANGE HANDLER ====================
  const handleTitleChange = useCallback((newTitle) => {
    setTitle(newTitle);
    
    // Check if title has changed from initial
    const hasChanged = newTitle !== initialTitleRef.current || 
                       content !== initialContentRef.current;
    setHasUnsavedChanges(hasChanged);
  }, [content]);

  // ==================== CHECK UNSAVED CHANGES ====================
  const checkForUnsavedChanges = useCallback(() => {
    const contentChanged = content !== initialContentRef.current;
    const titleChanged = title !== initialTitleRef.current;
    const hasChanges = contentChanged || titleChanged;
    
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [content, title]);

  // ==================== FORCE SAVE ====================
  const forceSave = useCallback(async () => {
    if (hasUnsavedChanges) {
      await saveContent();
    }
  }, [hasUnsavedChanges, saveContent]);

  // ==================== UPDATE POST OBJECT ====================
  const updatePost = useCallback((updates) => {
    setPost(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // ==================== REPLACE CONTENT ====================
  const replaceContent = useCallback((newContent) => {
    setContent(newContent);
    const hasChanged = newContent !== initialContentRef.current || 
                       title !== initialTitleRef.current;
    setHasUnsavedChanges(hasChanged);
  }, [title]);

  // ==================== EFFECTS ====================
  
  // Effect 1: Load post on mount or when IDs change
  useEffect(() => {
    loadPost();
  }, [loadPost]);

  // Effect 2: Auto-save debounce (optional - can be moved to separate hook later)
  useEffect(() => {
    if (hasUnsavedChanges && (postId || webhookId)) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save (5 seconds after last change)
      saveTimeoutRef.current = setTimeout(() => {
        saveContent();
      }, 5000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, postId, webhookId, saveContent]);

  // Effect 3: Warn before unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ==================== RETURN ====================
  return {
    // State
    post,
    content,
    title,
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    
    // Setters (for direct manipulation if needed)
    setPost,
    setContent,
    setTitle,
    setIsLoading,
    setIsSaving,
    setLastSaved,
    setHasUnsavedChanges,
    
    // Operations
    loadPost,
    saveContent,
    handleContentChange,
    handleTitleChange,
    checkForUnsavedChanges,
    forceSave,
    updatePost,
    replaceContent,
  };
}