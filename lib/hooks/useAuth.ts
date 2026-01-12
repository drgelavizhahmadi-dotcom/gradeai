'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Hook to get the current session
 * Use this in client components
 */
export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    session,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}

/**
 * Hook that redirects to sign-in if not authenticated
 * Use this in protected client components
 */
export function useRequireAuth(redirectTo: string = '/auth/signin') {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}
