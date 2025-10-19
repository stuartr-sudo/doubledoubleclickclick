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
        return null
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
        topics_completed_at: data?.topics_completed_at
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err)
      return null
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

    // Always call backend function to guarantee uniqueness + RLS-safe creation
    try {
      const response = await fetch('/api/utils/auto-assign-username', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferred_user_name: candidate,
          display_name: currentUser.full_name || candidate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign username')
      }

      const result = await response.json()
      const uniqueName = result.data?.username || candidate

      // Update user profile with assigned username
      await updateProfile({ assigned_usernames: [uniqueName] })

      return { ...currentUser, assigned_usernames: [uniqueName] }
    } catch (_e) {
      // If the backend function fails for any reason, return the original user
      console.error("Failed to auto-assign username:", _e)
      return currentUser
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
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
          return
        }

        if (session?.user && mounted) {
          const userProfile = await fetchUserProfile(session.user)
          if (userProfile && mounted) {
            const userWithUsername = await ensureUsernameAssigned(userProfile)
            const userWithTokens = await ensureWelcomeTokens(userWithUsername)
            setUser(userWithTokens)
          }
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
        if (!mounted) return

        try {
          if (session?.user) {
            const userProfile = await fetchUserProfile(session.user)
            if (userProfile) {
              const userWithUsername = await ensureUsernameAssigned(userProfile)
              const userWithTokens = await ensureWelcomeTokens(userWithUsername)
              setUser(userWithTokens)
            }
          } else {
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
      topics_completed_at: profile?.topics_completed_at
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
  }
}
