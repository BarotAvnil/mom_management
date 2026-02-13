'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  UserCog,
  FileBarChart,
  UserCircle,
  Tags,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

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
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Calendar', href: '/calendar', icon: Calendar, roles: ['ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Meetings', href: '/meetings', icon: CalendarDays, roles: ['ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Users', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Staff', href: '/staff', icon: UserCog, roles: ['ADMIN'] },
    { name: 'Reports', href: '/reports', icon: FileBarChart, roles: ['ADMIN'] },
    { name: 'Profile', href: '/profile', icon: UserCircle, roles: ['ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Meeting Types', href: '/meeting-types', icon: Tags, roles: ['ADMIN'] },
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-background border-b border-border z-50 px-4 py-3 flex items-center justify-between shadow-sm">
        <span className="font-bold text-lg text-primary flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-sm">M</div>
          MOM Mgmt
        </span>
        <button onClick={() => setIsOpen(!isOpen)} className="text-foreground hover:bg-muted p-2 rounded-md transition-colors focus:outline-none">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-background border-r border-border w-72 transform transition-transform duration-300 ease-in-out z-50 md:translate-x-0 md:static flex flex-col",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
              M
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">MOM Mgmt</h1>
              <p className="text-xs text-muted-foreground mt-1">Enterprise Edition</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.filter(item => !role || item.roles.includes(role)).map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border bg-muted/30">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

