'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'

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
        <div className="max-w-6xl mx-auto space-y-6 p-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-border pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Meeting Reports</h1>
                <button
                    onClick={downloadCSV}
                    disabled={reportData.length === 0}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-secondary hover:text-foreground h-9 px-4 py-2"
                >
                    Export CSV
                </button>
            </div>

            {/* FILTERS */}
            <div className="bg-card p-6 rounded-xl border border-border flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Meeting Type</label>
                    <select
                        value={typeId}
                        onChange={e => setTypeId(e.target.value)}
                        className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="">All Types</option>
                        {meetingTypes.map(t => <option key={t.meeting_type_id} value={t.meeting_type_id}>{t.meeting_type_name}</option>)}
                    </select>
                </div>
                <button
                    onClick={fetchReport}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
                >
                    Filter
                </button>
                <button
                    onClick={() => { setStartDate(''); setEndDate(''); setTypeId(''); fetchReport() }}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-secondary hover:text-foreground h-10 px-4"
                >
                    Clear
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-secondary/50 border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendance</th>
                            <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">MOM</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading report...</td></tr>
                        ) : reportData.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No meetings found for the selected period.</td></tr>
                        ) : (
                            reportData.map(r => (
                                <tr key={r.id} className="hover:bg-secondary/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-foreground font-medium">{r.type}</td>
                                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">{r.description || '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-primary h-1.5" style={{ width: r.attendanceRate }}></div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{r.presentMembers}/{r.totalMembers}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {r.hasMOM ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                Uploaded
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
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
    )
}
