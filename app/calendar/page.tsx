'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
    const { token, ready } = useAuth()
    const { addToast } = useToast()
    const router = useRouter()

    const [meetings, setMeetings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())

    // Filter State
    const [selectedType, setSelectedType] = useState('')

    // Config Data (for Modal & Filter)
    const [meetingTypes, setMeetingTypes] = useState<any[]>([])
    const [staffList, setStaffList] = useState<any[]>([])
    const [usersList, setUsersList] = useState<any[]>([])

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newMeeting, setNewMeeting] = useState({
        date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        typeId: '',
        desc: '',
        staffIds: [] as string[],
        meetingAdminId: ''
    })
    const [submitting, setSubmitting] = useState(false)

    // Tooltip State
    const [hoveredMeeting, setHoveredMeeting] = useState<any | null>(null)
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

    const loadData = async () => {
        try {
            // Fetch Meetings
            const res = await fetch('/api/meetings', { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            setMeetings(Array.isArray(data) ? data : (data.data || []))

            // Fetch Configs
            const tRes = await fetch('/api/meeting-type', { headers: { Authorization: `Bearer ${token}` } })
            const tData = await tRes.json()
            if (tData.data) setMeetingTypes(tData.data)

            const sRes = await fetch('/api/staff', { headers: { Authorization: `Bearer ${token}` } })
            const sData = await sRes.json()
            if (sData.data) setStaffList(sData.data)

            const uRes = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
            if (uRes.ok) {
                const uData = await uRes.json()
                setUsersList(uData.data || [])
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (ready && token) loadData()
    }, [ready, token])

    // Create Meeting Handler
    const createMeeting = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    meetingDate: newMeeting.date,
                    meetingTypeId: Number(newMeeting.typeId),
                    description: newMeeting.desc,
                    staffIds: newMeeting.staffIds,
                    meetingAdminId: newMeeting.meetingAdminId ? Number(newMeeting.meetingAdminId) : null
                })
            })
            if (res.ok) {
                setIsModalOpen(false)
                setNewMeeting({ date: '', typeId: '', desc: '', staffIds: [], meetingAdminId: '' })
                addToast('Meeting scheduled successfully!', 'success')
                loadData() // Reload calendar
            } else {
                const err = await res.json()
                addToast(err.message || 'Failed', 'error')
            }
        } catch (error) {
            addToast('Error creating meeting', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    // Interaction Handlers
    const handleDayClick = (day: number) => {
        // Construct local date string manually to avoid timezone shifts
        const mString = String(month + 1).padStart(2, '0')
        const dString = String(day).padStart(2, '0')

        // Smart Time: If today, use current time. Else 09:00
        const now = new Date()
        let timeStr = '09:00'
        if (year === now.getFullYear() && month === now.getMonth() && day === now.getDate()) {
            const h = String(now.getHours()).padStart(2, '0')
            const m = String(now.getMinutes()).padStart(2, '0')
            timeStr = `${h}:${m}`
        }

        const dateStr = `${year}-${mString}-${dString}T${timeStr}`
        setNewMeeting(prev => ({ ...prev, date: dateStr }))
        setIsModalOpen(true)
    }

    const handleMeetingHover = (e: React.MouseEvent, m: any) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setTooltipPos({ x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 5 })
        setHoveredMeeting(m)
    }

    // Calendar Logic
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const today = () => setCurrentDate(new Date())

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const filteredMeetings = meetings.filter(m => {
        if (selectedType && String(m.meeting_type_id) !== selectedType) return false
        return true
    })

    const renderCalendar = () => {
        const blanks = Array(firstDay).fill(null)
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
        const allSlots = [...blanks, ...days]

        return (
            <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden select-none">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {d}
                    </div>
                ))}

                {allSlots.map((day, index) => {
                    if (!day) return <div key={`blank-${index}`} className="bg-white h-32 md:h-40" />

                    const dayMeetings = filteredMeetings.filter(m => {
                        const mDate = new Date(m.meeting_date)
                        return mDate.getDate() === day && mDate.getMonth() === month && mDate.getFullYear() === year
                    })

                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

                    return (
                        <div
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={`bg-white h-32 md:h-40 p-2 border-t border-slate-100 relative group transition-colors hover:bg-slate-50 cursor-pointer ${isToday ? 'bg-indigo-50/30' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                                    {day}
                                </span>
                                {dayMeetings.length > 0 && (
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{dayMeetings.length} m</span>
                                )}
                            </div>

                            <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                                {dayMeetings.slice(0, 3).map(m => {
                                    // Calculate End of Day for the meeting
                                    const meetingDate = new Date(m.meeting_date)
                                    const endOfDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate(), 23, 59, 59)
                                    const isEnded = m.is_completed || (!m.is_cancelled && new Date() > endOfDay)

                                    return (
                                        <Link
                                            key={m.meeting_id}
                                            href={`/meetings/${m.meeting_id}`}
                                            className="block"
                                            onClick={(e) => e.stopPropagation()} // Prevent day click
                                            onMouseEnter={(e) => handleMeetingHover(e, m)}
                                            onMouseLeave={() => setHoveredMeeting(null)}
                                        >
                                            <div className={`text-[10px] p-1 rounded border truncate transition-all hover:scale-[1.02] ${m.is_cancelled ? 'bg-red-50 text-red-700 border-red-100' : isEnded ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'}`}>
                                                {isEnded && <span className="font-bold mr-1">[END]</span>}
                                                {new Date(m.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {m.meeting_type?.meeting_type_name}
                                            </div>
                                        </Link>
                                    )
                                })}
                                {dayMeetings.length > 3 && (
                                    <div className="text-[10px] text-slate-400 pl-1">+ {dayMeetings.length - 3} more</div>
                                )}
                            </div>

                            {/* Hover "Add" indicator */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold">+</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    if (!ready || loading) return <div className="flex h-96 items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
                    <p className="text-slate-500">Manage your schedule</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Filter */}
                    <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="">All Types</option>
                        {meetingTypes.map(t => (
                            <option key={t.meeting_type_id} value={t.meeting_type_id}>{t.meeting_type_name}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">◀</button>
                        <div className="w-40 text-center font-bold text-lg text-slate-800">{monthNames[month]} {year}</div>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">▶</button>
                    </div>

                    <button onClick={today} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 border border-slate-200 bg-white rounded-lg">Today</button>
                </div>
            </div>

            {renderCalendar()}

            {/* Quick Peek Tooltip directly in DOM */}
            {hoveredMeeting && (
                <div
                    className="fixed z-50 bg-slate-800 text-white p-3 rounded-lg shadow-xl text-xs pointer-events-none w-64 animate-fade-in"
                    style={{ left: tooltipPos.x, top: tooltipPos.y }}
                >
                    <h4 className="font-bold mb-1 text-sm">{hoveredMeeting.meeting_description || 'No Desc'}</h4>
                    <p className="text-slate-300 mb-1">⏰ {new Date(hoveredMeeting.meeting_date).toLocaleString()}</p>
                    <p className="text-slate-300">🏷️ {hoveredMeeting.meeting_type?.meeting_type_name}</p>
                    {hoveredMeeting.is_cancelled && <span className="block mt-2 text-red-300 font-bold">CANCELLED</span>}

                    {/* Attendees List */}
                    <div className="mt-2 pt-2 border-t border-slate-700">
                        <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Attendees ({hoveredMeeting.meeting_member?.length || 0})</p>
                        <ul className="space-y-0.5">
                            {hoveredMeeting.meeting_member && hoveredMeeting.meeting_member.slice(0, 3).map((mm: any) => (
                                <li key={mm.meeting_member_id} className="flex items-center gap-1.5 text-slate-300">
                                    <span className={`w-1.5 h-1.5 rounded-full ${mm.is_present ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                                    {mm.staff?.staff_name}
                                </li>
                            ))}
                            {(hoveredMeeting.meeting_member?.length || 0) > 3 && (
                                <li className="text-slate-500 italic pl-3">+ {(hoveredMeeting.meeting_member?.length || 0) - 3} more</li>
                            )}
                            {(!hoveredMeeting.meeting_member || hoveredMeeting.meeting_member.length === 0) && (
                                <li className="text-slate-600 italic">No attendees added</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* Create Meeting Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-in" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">Schedule on {new Date(newMeeting.date).toLocaleDateString()}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">✕</button>
                        </div>
                        <form onSubmit={createMeeting} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date & Time *</label>
                                    <input type="datetime-local" required value={newMeeting.date} onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Type *</label>
                                    <div className="relative">
                                        <select required value={newMeeting.typeId} onChange={e => setNewMeeting({ ...newMeeting, typeId: e.target.value })} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg outline-none appearance-none">
                                            <option value="">Select Type</option>
                                            {meetingTypes.map(t => <option key={t.meeting_type_id} value={t.meeting_type_id}>{t.meeting_type_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {usersList.length > 0 && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Meeting Admin</label>
                                        <select value={newMeeting.meetingAdminId} onChange={e => setNewMeeting({ ...newMeeting, meetingAdminId: e.target.value })} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg outline-none">
                                            <option value="">Myself</option>
                                            {usersList.map(u => <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Add Participants</label>
                                <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-2 bg-secondary/50 space-y-2">
                                    {staffList.map(s => (
                                        <label key={s.staff_id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                                            <input type="checkbox" className="rounded border-border text-primary" checked={newMeeting.staffIds.includes(String(s.staff_id))} onChange={e => {
                                                const id = String(s.staff_id); setNewMeeting(prev => ({ ...prev, staffIds: e.target.checked ? [...prev.staffIds, id] : prev.staffIds.filter(x => x !== id) }))
                                            }} />
                                            <span className="text-sm">{s.staff_name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Description</label>
                                <textarea rows={3} value={newMeeting.desc} onChange={e => setNewMeeting({ ...newMeeting, desc: e.target.value })} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg outline-none resize-none" placeholder="Details..." />
                            </div>
                            <div className="pt-4 flex gap-3 justify-end border-t border-border mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-muted-foreground hover:bg-secondary rounded-lg font-medium text-sm">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-medium shadow-sm transition-all disabled:opacity-70 text-sm">
                                    {submitting ? 'Scheduling...' : 'Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
