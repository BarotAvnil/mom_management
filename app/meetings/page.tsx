'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'

export default function MeetingsPage() {
    const { token, ready } = useAuth()
    const [meetings, setMeetings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchMeetings = async () => {
        try {
            const res = await fetch('/api/meetings', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            // Support both { data: [...] } and directly [...] for backward compatibility if any
            const list = Array.isArray(data) ? data : (data.data || [])
            setMeetings(list)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (ready && token) fetchMeetings()
    }, [ready, token])

    if (!ready || loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        )
    }

    const filteredMeetings = meetings.filter(m =>
        (m.meeting_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.meeting_type?.meeting_type_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Meetings</h1>
                    <p className="text-slate-500 mt-1">Manage all your scheduled meetings</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                    <input
                        placeholder="Search meetings..."
                        className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredMeetings.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="text-4xl mb-4">📅</div>
                        <h3 className="text-lg font-bold text-slate-700">No Meetings Found</h3>
                        <p className="text-slate-500">Try adjusting your search or schedule a new meeting from the dashboard.</p>
                    </div>
                ) : (
                    filteredMeetings.map((m, i) => (
                        <Link
                            key={m.meeting_id}
                            href={`/meetings/${m.meeting_id}`}
                            className="group block"
                        >
                            <div
                                className="glass-card flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl animate-slide-in hover:border-indigo-200"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border font-bold ${m.is_cancelled ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-slate-200 text-slate-700'}`}>
                                        <span className="text-xs uppercase tracking-wide opacity-70">{new Date(m.meeting_date).toLocaleString('en-US', { month: 'short' })}</span>
                                        <span className="text-xl">{new Date(m.meeting_date).getDate()}</span>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                {m.meeting_description || 'No Description'}
                                            </h3>
                                            {m.is_cancelled && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold">CANCELLED</span>}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                ⏰ {new Date(m.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="flex items-center gap-1">
                                                🏷️ {m.meeting_type?.meeting_type_name || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 flex items-center justify-end">
                                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:pl-1 transition-all shadow-sm">
                                        ➜
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
