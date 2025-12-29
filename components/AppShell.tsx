'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    // Pages that don't need the sidebar (auth pages)
    const isAuthPage = pathname === '/login' || pathname === '/register'

    return (
        <ToastProvider>
            <div className="flex h-full w-full">
                {/* Show Sidebar only if not on auth pages */}
                {!isAuthPage && <Sidebar />}

                {/* Main Content Area */}
                <main className={`flex-1 overflow-auto h-full w-full relative ${!isAuthPage ? 'md:p-8 p-4 pt-20 md:pt-8' : ''}`}>
                    {children}
                </main>
            </div>
        </ToastProvider>
    )
}
