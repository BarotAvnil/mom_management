'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'
import { Search, Filter, ChevronRight, CalendarDays, Clock, Tag, Loader2 } from 'lucide-react'

export default function MeetingsPage() {
    const { token, ready } = useAuth()
    const [meetings, setMeetings] = useState<any[]>([])
    const [meetingTypes, setMeetingTypes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('')

    const fetchMeetings = async () => {
        try {
            const res = await fetch('/api/meetings', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            const list = Array.isArray(data) ? data : (data.data || [])
            setMeetings(list)

            const tRes = await fetch('/api/meeting-type', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const tData = await tRes.json()
            if (tData.data) setMeetingTypes(tData.data)
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
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    const filteredMeetings = meetings.filter(m => {
        const matchesSearch = (m.meeting_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.meeting_type?.meeting_type_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = selectedType ? String(m.meeting_type_id) === selectedType : true

        return matchesSearch && matchesType
    })

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Meetings</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage all your scheduled meetings</p>
                </div>

                {/* Search & Filter */}
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative">
                        <select
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                            className="h-10 pl-3.5 pr-8 rounded-xl border border-border bg-white/60 backdrop-blur-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 text-sm appearance-none transition-all"
                        >
                            <option value="">All Types</option>
                            {meetingTypes.map(t => (
                                <option key={t.meeting_type_id} value={t.meeting_type_id}>{t.meeting_type_name}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            placeholder="Search meetings..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredMeetings.length === 0 ? (
                    <div className="text-center py-20 glass-card rounded-2xl border-2 border-dashed">
                        <CalendarDays className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-foreground">No Meetings Found</h3>
                        <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or schedule a new meeting from the dashboard.</p>
                    </div>
                ) : (
                    filteredMeetings.map((m, i) => {
                        return (
                            <Link
                                key={m.meeting_id}
                                href={`/meetings/${m.meeting_id}`}
                                className="group block"
                            >
                                <div
                                    className="glass-card flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl animate-slide-in"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border font-bold ${m.is_cancelled ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white/80 border-border text-foreground'}`}>
                                            <span className="text-xs uppercase tracking-wide opacity-70">{new Date(m.meeting_date).toLocaleString('en-US', { month: 'short' })}</span>
                                            <span className="text-xl">{new Date(m.meeting_date).getDate()}</span>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-foreground group-hover:text-indigo-600 transition-colors">
                                                    {m.meeting_description || 'No Description'}
                                                </h3>
                                                {m.is_cancelled && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full font-bold">CANCELLED</span>}
                                                {!m.is_cancelled && m.is_completed && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-full font-bold">COMPLETED</span>}
                                                {!m.is_cancelled && !m.is_completed && new Date() > new Date(m.meeting_date) && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-bold animate-pulse">IN PROGRESS</span>}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(m.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="w-1 h-1 bg-border rounded-full" />
                                                <span className="flex items-center gap-1.5">
                                                    <Tag className="w-3.5 h-3.5" />
                                                    {m.meeting_type?.meeting_type_name || 'General'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 md:mt-0 flex items-center justify-end">
                                        <div className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}
