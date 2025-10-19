import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user: currentUser, loading } = useAuth();
  const [assignedUsernames, setAssignedUsernames] = useState([]);
  const [selectedUsername, setSelectedUsernameState] = useState(null);

  const setSelectedUsername = (username) => {
    setSelectedUsernameState(username);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubleclick_workspace_username', username);
    }
  };

  const fetchWorkspaceData = useCallback(async () => {
    if (!currentUser) {
      setAssignedUsernames([]);
      setSelectedUsernameState(null);
      return;
    }

    try {
      let usernames = [];
      if (currentUser?.role === 'admin' || currentUser?.is_superadmin) {
        // In a real scenario, you might fetch all usernames for admins.
        // For now, we'll stick to assigned usernames for consistency.
        usernames = currentUser?.assigned_usernames || [];
      } else {
        usernames = currentUser?.assigned_usernames || [];
      }
      
      const activeUsernames = usernames.filter(Boolean).sort((a, b) => a.localeCompare(b));
      setAssignedUsernames(activeUsernames);

      const savedUsername = localStorage.getItem('doubleclick_workspace_username');

      if (savedUsername && activeUsernames.includes(savedUsername)) {
        setSelectedUsernameState(savedUsername);
      } else if (activeUsernames.length > 0) {
        setSelectedUsernameState(activeUsernames[0]);
      } else {
        setSelectedUsernameState(null);
      }
    } catch (error) {
      console.error('Error fetching workspace data:', error);
      setAssignedUsernames([]);
      setSelectedUsernameState(null);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const value = {
    assignedUsernames,
    selectedUsername,
    setSelectedUsername,
    isLoading: loading,
    currentUser,
    refreshWorkspace: fetchWorkspaceData,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}