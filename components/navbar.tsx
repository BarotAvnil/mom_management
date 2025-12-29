'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  return (
    <nav
      style={{
        padding: '12px 20px',
        background: '#222',
        color: '#fff',
        display: 'flex',
        gap: 16,
        alignItems: 'center'
      }}
    >
      <Link href="/dashboard" style={{ color: '#fff' }}>
        Dashboard
      </Link>

      <Link href="/attendance" style={{ color: '#fff' }}>
        Attendance
      </Link>

      <Link href="/mom-upload" style={{ color: '#fff' }}>
        MOM Upload
      </Link>

      <Link href="/reports" style={{ color: '#fff' }}>
        Reports
      </Link>

      <button
        onClick={logout}
        style={{
          marginLeft: 'auto',
          background: '#e74c3c',
          color: '#fff',
          border: 'none',
          padding: '6px 12px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </nav>
  )
}
