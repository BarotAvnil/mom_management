'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { Download, Filter, RefreshCw, Loader2 } from 'lucide-react'

export default function ReportsPage() {
    const { token, ready } = useAuth()

    // Filters
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [typeId, setTypeId] = useState('')
    const [meetingTypes, setMeetingTypes] = useState<any[]>([])

    // Data
    const [reportData, setReportData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    /* ---------------- FETCH DATA ---------------- */
    const fetchReport = async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (typeId) params.append('typeId', typeId)

        const res = await fetch(`/api/reports/meeting-summary?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setReportData(data.data || [])
        setLoading(false)
    }

    const fetchTypes = async () => {
        const res = await fetch('/api/meeting-type', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.data) setMeetingTypes(data.data)
    }

    useEffect(() => {
        if (ready && token) {
            fetchTypes()
            fetchReport()
        }
    }, [ready, token])

    /* ---------------- EXPORT CSV ---------------- */
    const downloadCSV = () => {
        const headers = ['Meeting ID', 'Date', 'Type', 'Description', 'Total Members', 'Present Details', 'MOM Status']
        const rows = reportData.map(r => [
            r.id,
            new Date(r.date).toLocaleString(),
            r.type,
            `"${r.description || ''}"`,
            r.totalMembers,
            `${r.presentMembers} / ${r.totalMembers} (${r.attendanceRate})`,
            r.hasMOM ? 'Uploaded' : 'Pending'
        ])

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `meeting_report_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
    }

    /* ---------------- RENDER ---------------- */
    if (!ready) return null

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-2 md:p-6 animate-fade-in">
            <div className="flex justify-between items-center pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Meeting Reports</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Generate and export meeting summary reports</p>
                </div>
                <button
                    onClick={downloadCSV}
                    disabled={reportData.length === 0}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium border border-border bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all focus:ring-2 focus:ring-indigo-500/30 disabled:pointer-events-none disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* FILTERS */}
            <div className="glass-card rounded-2xl p-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 tracking-wider">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-white/60 backdrop-blur-sm px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 tracking-wider">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-white/60 backdrop-blur-sm px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 tracking-wider">Meeting Type</label>
                    <select
                        value={typeId}
                        onChange={e => setTypeId(e.target.value)}
                        className="h-10 w-40 rounded-xl border border-border bg-white/60 backdrop-blur-sm px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                    >
                        <option value="">All Types</option>
                        {meetingTypes.map(t => <option key={t.meeting_type_id} value={t.meeting_type_id}>{t.meeting_type_name}</option>)}
                    </select>
                </div>
                <button
                    onClick={fetchReport}
                    className="h-10 px-6 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/10 active:scale-[0.98]"
                >
                    <Filter className="w-4 h-4 inline mr-1.5" />
                    Filter
                </button>
                <button
                    onClick={() => { setStartDate(''); setEndDate(''); setTypeId(''); fetchReport() }}
                    className="h-10 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 inline mr-1.5" />
                    Clear
                </button>
            </div>

            {/* TABLE */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/40 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attendance</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">MOM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading report...
                                </td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No meetings found for the selected period.</td></tr>
                            ) : (
                                reportData.map(r => (
                                    <tr key={r.id} className="hover:bg-white/40 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-foreground">{new Date(r.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-foreground font-medium">{r.type}</td>
                                        <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">{r.description || '—'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: r.attendanceRate }}></div>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{r.presentMembers}/{r.totalMembers}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {r.hasMOM ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                    Uploaded
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                                                    Pending
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
        </div>
    )
}
