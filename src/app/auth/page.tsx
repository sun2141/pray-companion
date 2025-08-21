'use client'

import { useRouter } from 'next/navigation'
import { AuthModal } from '@/features/auth/components/AuthModal'

export default function AuthPage() {
  const router = useRouter()

  return (
    <AuthModal 
      onSuccess={() => {
        router.push('/')
      }} 
    />
  )
}