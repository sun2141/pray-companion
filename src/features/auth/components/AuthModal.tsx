'use client'

import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'

type AuthMode = 'login' | 'signup'

interface AuthModalProps {
  initialMode?: AuthMode
  onSuccess?: () => void
}

export function AuthModal({ initialMode = 'login', onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 py-12 px-4 sm:px-6 lg:px-8">
      {mode === 'login' ? (
        <LoginForm
          onSuccess={onSuccess}
          onSwitchToSignUp={() => setMode('signup')}
        />
      ) : (
        <SignUpForm
          onSuccess={onSuccess}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </div>
  )
}