import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import app from '@/api/appClient';
import { toast } from 'sonner';

const CredentialsContext = createContext(null);

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const CredentialsProvider = ({ children }) => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const cacheTimestamp = useRef(0);
  const loadingRef = useRef(false);
  const userRef = useRef(null);

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
      // Get user once and cache
      if (!userRef.current) {
        try {
          userRef.current = await app.auth.me();
        } catch (e) {
          console.error('Failed to load user:', e);
          return [];
        }
      }

      const user = userRef.current;
      const assignedUsernames = Array.isArray(user?.assigned_usernames) ? user.assigned_usernames : [];
      
      if (assignedUsernames.length === 0) {
        setCredentials([]);
        cacheTimestamp.current = Date.now();
        return [];
      }

      // Fetch ALL credentials at once (no filter to avoid multiple queries)
      const allCreds = await app.entities.IntegrationCredential.list('-updated_date', 100);
      
      // Filter client-side by assigned usernames
      const userCreds = (allCreds || []).filter(cred => 
        cred.user_name && assignedUsernames.includes(cred.user_name)
      );
      
      setCredentials(userCreds);
      cacheTimestamp.current = Date.now();
      return userCreds;
      
    } catch (error) {
      console.error('Failed to load credentials:', error);
      
      if (error?.response?.status === 429) {
        console.warn('Rate limit hit - using cached credentials');
        // Return cached credentials even if expired
        return credentials;
      } else {
        toast.error('Failed to load credentials');
        return [];
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [credentials]);

  const getCredentialsByProvider = useCallback((provider) => {
    return credentials.filter(c => c.provider === provider);
  }, [credentials]);

  const invalidateCache = useCallback(() => {
    cacheTimestamp.current = 0;
    setCredentials([]);
  }, []);

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