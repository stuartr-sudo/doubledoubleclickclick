import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/api/supabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) return null

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // If no profile exists, create a basic one
        const basicProfile = {
          id: authUser.id,
          user_name: authUser.email?.split('@')[0] || 'user',
          assigned_usernames: [],
          token_balance: 20,
          is_superadmin: false,
          role: 'user',
          completed_tutorial_ids: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Try to create the profile
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert(basicProfile)

        if (createError) {
          console.error('Error creating user profile:', createError)
      // Return basic profile even if creation fails
      return {
        ...authUser,
        ...basicProfile,
        topics_onboarding_completed_at: '{}',
        topics_timer_override: '{}',
        topics_timer_hours: '{}',
        topics: [],
        article_creation_timestamps: []
      }
        }

        return {
          ...authUser,
          ...basicProfile,
          topics_onboarding_completed_at: '{}',
          topics_timer_override: '{}',
          topics_timer_hours: '{}',
          topics: [],
          article_creation_timestamps: []
        }
      }

      return {
        ...authUser,
        ...data,
        // Ensure backwards compatibility with Base44 user structure
        user_name: data?.user_name || authUser.email?.split('@')[0],
        assigned_usernames: data?.assigned_usernames || [],
        token_balance: data?.token_balance || 20,
        plan_price_id: data?.plan_price_id,
        is_superadmin: data?.is_superadmin || false,
        role: data?.role || 'user',
        completed_tutorial_ids: data?.completed_tutorial_ids || [],
        topics_completed_at: data?.topics_completed_at,
        topics_onboarding_completed_at: data?.topics_onboarding_completed_at || '{}',
        topics_timer_override: data?.topics_timer_override || '{}',
        topics_timer_hours: data?.topics_timer_hours || '{}',
        topics: data?.topics || [],
        article_creation_timestamps: data?.article_creation_timestamps || []
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err)
      // Return a basic user profile to prevent app crash
      return {
        ...authUser,
        user_name: authUser.email?.split('@')[0] || 'user',
        assigned_usernames: [],
        token_balance: 20,
        is_superadmin: false,
        role: 'user',
        completed_tutorial_ids: [],
        topics_onboarding_completed_at: '{}',
        topics_timer_override: '{}',
        topics_timer_hours: '{}',
        topics: [],
        article_creation_timestamps: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signUp = useCallback(async (email, password, metadata = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error

      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error

      return true
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Refresh user data
      const updatedProfile = await fetchUserProfile(user)
      setUser(updatedProfile)

      return updatedProfile
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, fetchUserProfile])

  const ensureUsernameAssigned = useCallback(async (currentUser) => {
    if (!currentUser) return currentUser
    if (Array.isArray(currentUser.assigned_usernames) && currentUser.assigned_usernames.length > 0) {
      return currentUser
    }

    // Build candidate from full_name (not random). Fallback to email local part.
    const baseFromFullName = (currentUser.full_name || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24)

    const emailLocal = ((currentUser.email || "user").split("@")[0] || "user")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24)

    const candidate = baseFromFullName || emailLocal || "user"

    // For now, just assign the candidate directly to prevent API call issues
    // TODO: Re-implement auto-assign-username API call later
    try {
      const uniqueName = candidate + '_' + Math.random().toString(36).substr(2, 9)
      
      // Update user profile with assigned username
      await updateProfile({ assigned_usernames: [uniqueName] })

      return { ...currentUser, assigned_usernames: [uniqueName] }
    } catch (_e) {
      // If the update fails for any reason, return the original user with a fallback username
      console.error("Failed to assign username:", _e)
      return { ...currentUser, assigned_usernames: [candidate] }
    }
  }, [updateProfile])

  const ensureWelcomeTokens = useCallback(async (currentUser) => {
    if (!currentUser) return currentUser
    
    // Only add welcome tokens if user has no tokens and hasn't been assigned any
    if (currentUser.token_balance && currentUser.token_balance > 0) {
      return currentUser
    }

    try {
      await updateProfile({ token_balance: 20 })
      return { ...currentUser, token_balance: 20 }
    } catch (_e) {
      console.error("Failed to ensure welcome tokens:", _e)
      return currentUser
    }
  }, [updateProfile])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('Session check result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user, 
          error: error?.message 
        })
        
        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
          return
        }

        if (session?.user && mounted) {
          console.log('Found authenticated user:', session.user.email)
          const userProfile = await fetchUserProfile(session.user)
          if (userProfile && mounted) {
            const userWithUsername = await ensureUsernameAssigned(userProfile)
            const userWithTokens = await ensureWelcomeTokens(userWithUsername)
            console.log('User profile loaded successfully')
            setUser(userWithTokens)
          }
        } else {
          console.log('No authenticated session found')
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError(err.message)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user })
        
        if (!mounted) return

        try {
          if (session?.user) {
            console.log('Auth state change: User signed in:', session.user.email)
            const userProfile = await fetchUserProfile(session.user)
            if (userProfile) {
              const userWithUsername = await ensureUsernameAssigned(userProfile)
              const userWithTokens = await ensureWelcomeTokens(userWithUsername)
              setUser(userWithTokens)
            }
          } else {
            console.log('Auth state change: User signed out')
            setUser(null)
          }
        } catch (err) {
          console.error('Error in auth state change:', err)
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile, ensureUsernameAssigned, ensureWelcomeTokens])

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    ensureUsernameAssigned,
    ensureWelcomeTokens
  }
}

// Legacy compatibility - maintain Base44 User interface
export const User = {
  me: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      throw new Error('Not authenticated')
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error('Failed to fetch user profile')
    }

    return {
      ...user,
      ...profile,
      // Ensure backwards compatibility
      user_name: profile?.user_name || user.email?.split('@')[0],
      assigned_usernames: profile?.assigned_usernames || [],
      token_balance: profile?.token_balance || 20,
      plan_price_id: profile?.plan_price_id,
      is_superadmin: profile?.is_superadmin || false,
      role: profile?.role || 'user',
      completed_tutorial_ids: profile?.completed_tutorial_ids || [],
      topics_completed_at: profile?.topics_completed_at,
      topics_onboarding_completed_at: profile?.topics_onboarding_completed_at || '{}',
      topics_timer_override: profile?.topics_timer_override || '{}',
      topics_timer_hours: profile?.topics_timer_hours || '{}',
      topics: profile?.topics || [],
      article_creation_timestamps: profile?.article_creation_timestamps || []
    }
  },

  updateMe: async (updates) => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      throw new Error('Not authenticated')
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)

    if (updateError) {
      throw new Error('Failed to update profile')
    }

    return await User.me()
  },

  updateMyUserData: async (updates) => {
    // Alias for updateMe for backwards compatibility
    return await User.updateMe(updates)
  },

  // Topics onboarding specific methods
  completeTopicsOnboarding: async (username, topics) => {
    const currentUser = await User.me();
    if (!currentUser) throw new Error('User not authenticated');

    const currentTopics = currentUser.topics || [];
    const updatedTopics = Array.from(new Set([...currentTopics, username]));
    
    const currentOnboardingData = currentUser.topics_onboarding_completed_at || {};
    currentOnboardingData[username] = new Date().toISOString();

    return await User.updateMe({
      topics: updatedTopics,
      topics_onboarding_completed_at: JSON.stringify(currentOnboardingData)
    });
  },

  hasCompletedTopicsOnboarding: async (username) => {
    const currentUser = await User.me();
    if (!currentUser) return false;
    
    const onboardingData = currentUser.topics_onboarding_completed_at;
    if (!onboardingData) return false;
    
    try {
      const parsed = typeof onboardingData === 'string' ? JSON.parse(onboardingData) : onboardingData;
      return parsed[username] !== undefined;
    } catch {
      return false;
    }
  }
}
