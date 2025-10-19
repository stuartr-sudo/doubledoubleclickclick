import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { toast } from 'sonner';

export const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [assignedUsernames, setAssignedUsernames] = useState([]);
  const [selectedUsername, setSelectedUsernameState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const setSelectedUsername = (username) => {
    setSelectedUsernameState(username);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubleclick_workspace_username', username);
    }
  };

  const fetchWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      let usernames = [];
      if (user?.role === 'admin' || user?.is_superadmin) {
        // In a real scenario, you might fetch all usernames for admins.
        // For now, we'll stick to assigned usernames for consistency.
        usernames = user?.assigned_usernames || [];
      } else {
        usernames = user?.assigned_usernames || [];
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
      // Not an error if user is not logged in, just means no workspace.
      setAssignedUsernames([]);
      setSelectedUsernameState(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const value = {
    assignedUsernames,
    selectedUsername,
    setSelectedUsername,
    isLoading,
    currentUser,
    refreshWorkspace: fetchWorkspaceData,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}