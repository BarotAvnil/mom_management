'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard,
    ClipboardList,
    Building2,
    LogOut,
    Shield,
    ChevronRight,
    Menu,
    X,
    Users,
    UserCog
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
    { name: 'Registrations', href: '/super-admin/registrations', icon: ClipboardList },
    { name: 'Companies', href: '/super-admin/companies', icon: Building2 },
    { name: 'Users', href: '/super-admin/users', icon: Users },
    { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: ClipboardList },
    { name: 'My Profile', href: '/super-admin/profile', icon: UserCog },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [role, setRole] = useState<string | null>(null)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                setRole(payload.role)
                if (payload.role !== 'SUPER_ADMIN') {
                    router.push('/dashboard')
                }
            } catch {
                router.push('/login')
            }
        } else {
            router.push('/login')
        }
    }, [router])

    const logout = () => {
        localStorage.removeItem('token')
        router.push('/login')
    }

    if (role !== 'SUPER_ADMIN') return null

    return (
        <div className="flex min-h-screen bg-background bg-dot-pattern">
            {/* Mobile Toggle */}
            <div className="md:hidden fixed top-0 left-0 w-full glass z-50 px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-lg text-foreground flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    Super Admin
                </span>
                <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm border border-border text-foreground">
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Overlay */}
            {isOpen && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 h-full glass-sidebar w-72 transform transition-transform duration-300 ease-in-out z-50 md:translate-x-0 md:static flex flex-col",
                isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/20">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">Super Admin</h2>
                            <p className="text-xs text-muted-foreground">Platform Management</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/super-admin' && pathname.startsWith(item.href))
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
                                <span className="flex items-center gap-3">
                                    <item.icon className="w-[18px] h-[18px]" />
                                    {item.name}
                                </span>
                                <ChevronRight className={cn("w-4 h-4 transition-transform", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50/50 transition-all">
                        <LogOut className="w-[18px] h-[18px]" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-0 p-6 md:p-8 mt-14 md:mt-0 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
