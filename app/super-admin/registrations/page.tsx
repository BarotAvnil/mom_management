'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'
import { ClipboardList, Check, X, Loader2, Search, Filter, AlertTriangle } from 'lucide-react'

interface Registration {
    request_id: number
    company_name: string
    assistant_name: string
    assistant_email: string
    status: string
    rejection_reason?: string
    reviewed_at?: string
    reviewer?: { name: string; email: string }
    created_at: string
}

export default function RegistrationsPage() {
    const { token, ready } = useAuth()
    const { addToast } = useToast()
    const [requests, setRequests] = useState<Registration[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    // Modal state
    const [approveModal, setApproveModal] = useState<Registration | null>(null)
    const [rejectModal, setRejectModal] = useState<Registration | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [processing, setProcessing] = useState(false)

    const fetchRequests = async () => {
        try {
            const url = filterStatus ? `/api/super-admin/registrations?status=${filterStatus}` : '/api/super-admin/registrations'
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            setRequests(data.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (ready && token) fetchRequests()
    }, [ready, token, filterStatus])

    const handleAction = async (action: 'APPROVE' | 'REJECT', requestId: number) => {
        setProcessing(true)
        try {
            const res = await fetch('/api/super-admin/registrations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    requestId,
                    action,
                    ...(action === 'REJECT' ? { rejectionReason } : {})
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            addToast(data.message, 'success')
            setApproveModal(null)
            setRejectModal(null)
            setRejectionReason('')
            fetchRequests()
        } catch (err: any) {
            addToast(err.message || `Failed to ${action.toLowerCase()} request`, 'error')
        } finally {
            setProcessing(false)
        }
    }

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
            APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            REJECTED: 'bg-red-50 text-red-500 border-red-100',
        }
        return map[status] || 'bg-slate-50 text-slate-600 border-slate-100'
    }

    const filtered = requests.filter(r => {
        if (!searchTerm) return true
        const q = searchTerm.toLowerCase()
        return r.company_name.toLowerCase().includes(q) || r.assistant_name.toLowerCase().includes(q) || r.assistant_email.toLowerCase().includes(q)
    })

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Registration Requests</h1>
                <p className="text-muted-foreground mt-1 text-sm">Review and manage company registration requests</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <input
                        placeholder="Search by company, name, or email..."
                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
                <div className="relative">
                    <select
                        className="h-10 pl-3.5 pr-8 rounded-xl border border-border bg-white/60 backdrop-blur-sm outline-none text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <Filter className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/40 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assistant</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                                            <ClipboardList className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="font-medium text-foreground">No Requests Found</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {searchTerm || filterStatus ? 'Try adjusting your filters.' : 'No registration requests yet.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((req, i) => (
                                    <tr key={req.request_id} className="hover:bg-white/40 transition-colors animate-slide-in" style={{ animationDelay: `${i * 30}ms` }}>
                                        <td className="px-6 py-4 font-semibold text-foreground">{req.company_name}</td>
                                        <td className="px-6 py-4 text-foreground">{req.assistant_name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{req.assistant_email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(req.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'PENDING' ? (
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => setApproveModal(req)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/50 hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal(req)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 border border-red-200/50 hover:bg-red-100 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    {req.reviewer ? `by ${req.reviewer.name}` : '—'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* APPROVE MODAL */}
            {approveModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
                        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Check className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Approve Registration</h3>
                                <p className="text-xs text-muted-foreground">This action will create a new company and admin account</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="glass-inner rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Company</span>
                                    <span className="font-semibold text-foreground">{approveModal.company_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Admin</span>
                                    <span className="font-semibold text-foreground">{approveModal.assistant_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="text-foreground">{approveModal.assistant_email}</span>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button onClick={() => setApproveModal(null)} className="px-5 py-2.5 text-muted-foreground hover:bg-white/50 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                                <button
                                    onClick={() => handleAction('APPROVE', approveModal.request_id)}
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-medium shadow-sm transition-all disabled:opacity-50 text-sm active:scale-[0.98]"
                                >
                                    {processing ? 'Approving...' : 'Confirm Approval'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECT MODAL */}
            {rejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
                        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Reject Registration</h3>
                                <p className="text-xs text-muted-foreground">The company will not be created</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="glass-inner rounded-xl p-4">
                                <p className="text-sm"><span className="text-muted-foreground">Company:</span> <span className="font-semibold text-foreground">{rejectModal.company_name}</span></p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Reason for Rejection</label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    className="w-full h-24 px-3.5 py-3 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm resize-none"
                                    placeholder="Optional: Provide reason..."
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button onClick={() => { setRejectModal(null); setRejectionReason('') }} className="px-5 py-2.5 text-muted-foreground hover:bg-white/50 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                                <button
                                    onClick={() => handleAction('REJECT', rejectModal.request_id)}
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-medium shadow-sm transition-all disabled:opacity-50 text-sm active:scale-[0.98]"
                                >
                                    {processing ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
