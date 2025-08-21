'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useAuthContext } from './AuthProvider'
import { AuthModal } from '@/features/auth/components/AuthModal'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuthContext()
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setShowAuth(true)
    } else if (isAuthenticated) {
      setShowAuth(false)
    }
  }, [loading, isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (showAuth) {
    return fallback || (
      <AuthModal onSuccess={() => setShowAuth(false)} />
    )
  }

  return <>{children}</>
}