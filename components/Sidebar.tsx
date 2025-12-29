'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setRole(payload.role)
      } catch (e) {
        // invalid token
      }
    }
  }, [])

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Meetings', href: '/meetings', icon: '📅', roles: ['ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Users', href: '/admin/users', icon: '🔑', roles: ['ADMIN'] },
    { name: 'Staff', href: '/staff', icon: '👥', roles: ['ADMIN'] },
    { name: 'Reports', href: '/reports', icon: '📈', roles: ['ADMIN'] },
    { name: 'Profile', href: '/profile', icon: '👤', roles: ['ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Meeting Types', href: '/meeting-types', icon: '🏷️', roles: ['ADMIN'] },
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-background border-b border-border z-50 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg text-primary">MOM Mgmt</span>
        <button onClick={() => setIsOpen(!isOpen)} className="text-foreground focus:outline-none">
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full bg-primary text-primary-foreground w-64 transform transition-transform duration-200 ease-in-out z-50 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } md:static md:block border-r border-border`}
      >
        <div className="p-6 border-b border-primary-foreground/10">
          <h1 className="text-2xl font-bold tracking-tight">
            MOM <span className="text-muted-foreground/50">Mgmt</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">v1.0.0</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.filter(item => !role || item.roles.includes(role)).map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-primary-foreground text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-primary-foreground hover:bg-primary-foreground/10'
                  }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-primary-foreground/10">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground hover:opacity-90 py-2 px-4 rounded-lg transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
