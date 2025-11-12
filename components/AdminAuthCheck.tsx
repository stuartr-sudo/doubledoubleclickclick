'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Don't check auth on login page
    if (pathname === '/admin/login') {
      setIsChecking(false)
      setIsAuthenticated(true)
      return
    }

    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify')
        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/admin/login')
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  if (isChecking) {
    return (
      <div className="admin-loading">
        <p>Checking authentication...</p>
      </div>
    )
  }

  if (!isAuthenticated && pathname !== '/admin/login') {
    return null
  }

  return <>{children}</>
}

