import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CustomContentTemplate } from '@/api/entities';
import { toast } from 'sonner';

const TemplateContext = createContext(null);

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const cacheTimestamp = useRef(0);
  const loadingRef = useRef(false);

  const loadTemplates = useCallback(async (forceRefresh = false) => {
    // Check if cache is still valid
    const now = Date.now();
    const cacheAge = now - cacheTimestamp.current;
    
    if (!forceRefresh && templates.length > 0 && cacheAge < CACHE_DURATION) {
      // Cache is still fresh, return existing templates
      return templates;
    }

    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      // Wait for ongoing load
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!loadingRef.current) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      return templates;
    }

    loadingRef.current = true;
    setLoading(true);

    try {
      const allTemplates = await CustomContentTemplate.filter({ is_active: true });
      setTemplates(allTemplates || []);
      cacheTimestamp.current = Date.now();
      return allTemplates || [];
    } catch (error) {
      console.error('Failed to load templates:', error);
      
      if (error?.response?.status === 429) {
        toast.error('Rate limit reached. Using cached templates.', { duration: 3000 });
        // Return cached templates even if expired
        return templates;
      } else {
        toast.error('Failed to load templates');
        return [];
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [templates]);

  const getTemplatesByFeature = useCallback((featureType) => {
    return templates.filter(t => t.associated_ai_feature === featureType);
  }, [templates]);

  const value = {
    templates,
    loading,
    loadTemplates,
    getTemplatesByFeature,
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
};