'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session && !pathname.startsWith('/auth')) {
        router.push('/auth/login')
      } else if (session && pathname.startsWith('/auth')) {
        router.push('/')
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session && !pathname.startsWith('/auth')) {
          router.push('/auth/login')
        } else if (session && pathname.startsWith('/auth')) {
          router.push('/')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, pathname])

  return <>{children}</>
}