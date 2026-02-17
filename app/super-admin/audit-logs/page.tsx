'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Loader2, ShieldAlert, Search, FileText, User, Calendar, RefreshCcw } from 'lucide-react'

export default function AuditLogsPage() {
    const { token, ready } = useAuth()
    const { addToast } = useToast()

    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (ready && token) {
            fetchLogs()
        }
    }, [ready, token])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/super-admin/audit-logs', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                setLogs(data.data || [])
            } else {
                addToast(data.message || 'Failed to fetch logs', 'error')
            }
        } catch (error) {
            console.error(error)
            addToast('Network error', 'error')
        } finally {
            setLoading(false)
        }
    }

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actor?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Track all administrative actions across the platform</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="self-start md:self-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="glass-card rounded-2xl p-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search logs by action, user, or entity..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                    />
                    <Search className="absolute left-3.5 top-3 w-5 h-5 text-muted-foreground" />
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
                {loading && logs.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-foreground">No logs found</h3>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actor</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Entity</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredLogs.map((log) => (
                                    <tr key={log.log_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.actor ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                        {log.actor.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-foreground">{log.actor.name}</div>
                                                        <div className="text-xs text-muted-foreground">{log.actor.role}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic">System / Deleted User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-foreground capitalize">{log.entity_type}</div>
                                            <div className="text-xs text-muted-foreground">ID: {log.entity_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs text-xs text-muted-foreground font-mono bg-slate-50 p-1.5 rounded border border-slate-100 truncate" title={log.details}>
                                                {log.details || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(log.created_at)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
