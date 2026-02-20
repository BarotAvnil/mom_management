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
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MEMBER', 'ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Calendar', href: '/calendar', icon: Calendar, roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MEMBER', 'ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Meetings', href: '/meetings', icon: CalendarDays, roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MEMBER', 'ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Users', href: '/admin/users', icon: Users, roles: ['COMPANY_ADMIN', 'ADMIN'] },
    { name: 'Staff', href: '/staff', icon: UserCog, roles: ['COMPANY_ADMIN', 'ADMIN'] },
    { name: 'Reports', href: '/reports', icon: FileBarChart, roles: ['COMPANY_ADMIN', 'ADMIN'] },
    { name: 'Profile', href: '/profile', icon: UserCircle, roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MEMBER', 'ADMIN', 'CONVENER', 'STAFF', 'USER'] },
    { name: 'Meeting Types', href: '/meeting-types', icon: Tags, roles: ['COMPANY_ADMIN', 'ADMIN'] },
    { name: 'Super Admin', href: '/super-admin', icon: UserCog, roles: ['SUPER_ADMIN'] },
  ]

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full glass z-50 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg text-foreground flex items-center gap-2.5">
          <img src="/logo.png" alt="MOM Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
          MOM Mgmt
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-foreground hover:bg-white/50 p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full glass-sidebar w-72 transform transition-transform duration-300 ease-in-out z-50 md:translate-x-0 md:static flex flex-col",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MOM Logo" className="w-10 h-10 object-contain rounded-xl shadow-md" />
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none text-foreground">MOM Mgmt</h1>
              <p className="text-xs text-muted-foreground mt-1">Enterprise Edition</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.filter(item => !role || item.roles.includes(role)).map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50/80 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
