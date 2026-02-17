'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Building2, Users, CalendarDays, UserCog, Search, Loader2, Pause, Play } from 'lucide-react'

interface Company {
    company_id: number
    company_name: string
    domain?: string
    status: string
    created_at: string
    _count: {
        users: number
        staff: number
        meetings: number
    }
}

export default function CompaniesPage() {
    const { token, ready } = useAuth()
    const { addToast } = useToast()
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [toggling, setToggling] = useState<number | null>(null)

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/super-admin/companies', { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            setCompanies(data.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (ready && token) fetchCompanies()
    }, [ready, token])

    const toggleStatus = async (companyId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
        if (!confirm(`${newStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'} this company? ${newStatus === 'SUSPENDED' ? 'Users will be unable to login.' : ''}`)) return
        setToggling(companyId)
        try {
            const res = await fetch('/api/super-admin/companies', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ companyId, status: newStatus })
            })
            if (!res.ok) throw new Error()
            fetchCompanies()
            addToast(`Company ${newStatus.toLowerCase()}`, 'success')
        } catch {
            addToast('Failed to update company status', 'error')
        } finally {
            setToggling(null)
        }
    }

    const filtered = companies.filter(c => {
        if (!searchTerm) return true
        return c.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    })

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Companies</h1>
                    <p className="text-muted-foreground mt-1 text-sm">All registered tenants on the platform</p>
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        placeholder="Search companies..."
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
            </div>

            {/* Companies Grid */}
            {filtered.length === 0 ? (
                <div className="glass-card rounded-2xl p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="font-medium text-foreground">No Companies</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {searchTerm ? 'No results match your search.' : 'Companies will appear here once registrations are approved.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((company, i) => (
                        <div
                            key={company.company_id}
                            className="glass-card rounded-2xl p-6 animate-slide-in"
                            style={{ animationDelay: `${i * 40}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm">{company.company_name}</h3>
                                        <p className="text-xs text-muted-foreground font-mono">#{company.company_id}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${company.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-red-50 text-red-500 border-red-100'
                                    }`}>
                                    {company.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="text-center glass-inner rounded-lg py-2">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                                    <p className="text-lg font-bold text-foreground">{company._count.users}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Users</p>
                                </div>
                                <div className="text-center glass-inner rounded-lg py-2">
                                    <UserCog className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                                    <p className="text-lg font-bold text-foreground">{company._count.staff}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Staff</p>
                                </div>
                                <div className="text-center glass-inner rounded-lg py-2">
                                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                                    <p className="text-lg font-bold text-foreground">{company._count.meetings}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meetings</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                <span className="text-xs text-muted-foreground">
                                    Since {new Date(company.created_at).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={() => toggleStatus(company.company_id, company.status)}
                                    disabled={toggling === company.company_id}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${company.status === 'ACTIVE'
                                        ? 'bg-amber-50 text-amber-600 border border-amber-200/50 hover:bg-amber-100'
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 hover:bg-emerald-100'
                                        }`}
                                >
                                    {company.status === 'ACTIVE' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    {company.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
