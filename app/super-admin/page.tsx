'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { Building2, Users, ClipboardList, BarChart3, Clock, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Stats {
    companies: { total: number; active: number; suspended: number }
    users: { total: number }
    requests: { pending: number; approved: number; rejected: number }
    meetings: { total: number }
    recentPendingRequests: any[]
}

export default function SuperAdminDashboard() {
    const { token, ready } = useAuth()
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!ready || !token) return
        fetch('/api/super-admin/stats', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => setStats(d.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [ready, token])

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
    if (!stats) return null

    const cards = [
        { label: 'Total Companies', value: stats.companies.total, icon: Building2, color: 'bg-indigo-50 text-indigo-600', href: '/super-admin/companies' },
        { label: 'Active Companies', value: stats.companies.active, icon: Building2, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Users', value: stats.users.total, icon: Users, color: 'bg-sky-50 text-sky-600' },
        { label: 'Pending Requests', value: stats.requests.pending, icon: ClipboardList, color: 'bg-amber-50 text-amber-600', href: '/super-admin/registrations' },
        { label: 'Approved', value: stats.requests.approved, icon: ClipboardList, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Meetings', value: stats.meetings.total, icon: BarChart3, color: 'bg-violet-50 text-violet-600' },
    ]

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Overview</h1>
                <p className="text-muted-foreground mt-1 text-sm">Monitor all tenants and registration requests</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cards.map((card, i) => (
                    <div
                        key={i}
                        className="glass-card rounded-2xl p-6 animate-slide-in"
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</p>
                                <p className="text-3xl font-bold text-foreground mt-2">{card.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                        </div>
                        {card.href && (
                            <Link href={card.href} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                                View all <ArrowRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            {/* Recent Pending Requests */}
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Pending Requests
                    </h2>
                    <Link href="/super-admin/registrations" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        View all <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {stats.recentPendingRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No pending registration requests</p>
                ) : (
                    <div className="space-y-3">
                        {stats.recentPendingRequests.map((req: any) => (
                            <div key={req.request_id} className="glass-inner rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-foreground text-sm">{req.company_name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{req.assistant_name} • {req.assistant_email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">Pending</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
