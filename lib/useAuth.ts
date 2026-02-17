'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthState {
  token: string | null
  ready: boolean
  role: string | null
  companyId: number | null
  userId: number | null
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    token: null,
    ready: false,
    role: null,
    companyId: null,
    userId: null,
  })

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) {
      router.push('/login')
    } else {
      try {
        const payload = JSON.parse(atob(t.split('.')[1]))
        setState({
          token: t,
          ready: true,
          role: payload.role || null,
          companyId: payload.company_id ?? null,
          userId: payload.id || null,
        })
      } catch {
        // Corrupted token — force re-login
        localStorage.removeItem('token')
        router.push('/login')
      }
    }
  }, [router])

  return state
}
