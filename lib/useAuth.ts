'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) {
      router.push('/login')
    } else {
      setToken(t)
      setReady(true)
    }
  }, [])

  return { token, ready }
}
