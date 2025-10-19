import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { IntegrationCredential } from '@/api/entities';
import { toast } from 'sonner';

const CredentialsContext = createContext(null);

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const CredentialsProvider = ({ children }) => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const cacheTimestamp = useRef(0);
  const loadingRef = useRef(false);

  const loadCredentials = useCallback(async (forceRefresh = false) => {
    // Check if cache is still valid
    const now = Date.now();
    const cacheAge = now - cacheTimestamp.current;
    
    if (!forceRefresh && credentials.length > 0 && cacheAge < CACHE_DURATION) {
      // Cache is still fresh, return existing credentials
      return credentials;
    }

    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      // Wait for ongoing load (max 5 seconds)
      const startWait = Date.now();
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!loadingRef.current || (Date.now() - startWait) > 5000) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      return credentials;
    }

    loadingRef.current = true;
    setLoading(true);

    try {
      if (!user?.assigned_usernames || user.assigned_usernames.length === 0) {
        setCredentials([]);
        cacheTimestamp.current = Date.now();
        return [];
      }

      // Fetch credentials from Supabase
      const userCreds = await IntegrationCredential.filter({
        user_name: user.user_name
      });
      
      setCredentials(userCreds);
      cacheTimestamp.current = Date.now();
      return userCreds;
      
    } catch (error) {
      console.error('Failed to load credentials:', error);
      toast.error('Failed to load credentials');
      return [];
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user, credentials]);

  const getCredentialsByProvider = useCallback((provider) => {
    return credentials.filter(c => c.provider === provider);
  }, [credentials]);

  const invalidateCache = useCallback(() => {
    cacheTimestamp.current = 0;
    setCredentials([]);
  }, []);

  // Load credentials when user changes
  useEffect(() => {
    if (user) {
      loadCredentials(true); // Force refresh when user changes
    } else {
      setCredentials([]);
      cacheTimestamp.current = 0;
    }
  }, [user, loadCredentials]);

  const value = {
    credentials,
    loading,
    loadCredentials,
    getCredentialsByProvider,
    invalidateCache,
  };

  return (
    <CredentialsContext.Provider value={value}>
      {children}
    </CredentialsContext.Provider>
  );
};

export const useCredentials = () => {
  const context = useContext(CredentialsContext);
  if (!context) {
    throw new Error('useCredentials must be used within a CredentialsProvider');
  }
  return context;
};