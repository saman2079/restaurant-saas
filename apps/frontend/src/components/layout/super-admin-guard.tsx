'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/api/auth.store'

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!token || !user) {
      router.push('/login')
      return
    }
    if (user.role !== 'super_admin') {
      router.push('/login')
    }
  }, [token, user, router])

  if (!user || user.role !== 'super_admin') return null

  return <>{children}</>
}