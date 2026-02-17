'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'
import { CalendarDays, Ban, FileText, Plus, Clock, ChevronRight, Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { token, ready } = useAuth()
  const { addToast } = useToast()

  // Data State
  const [stats, setStats] = useState({ total: 0, cancelled: 0, pendingMOM: 0 })
  const [ongoing, setOngoing] = useState<any[]>([])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [recentMOMs, setRecentMOMs] = useState<any[]>([])
  const [meetingTypes, setMeetingTypes] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [loadingConfig, setLoadingConfig] = useState(true)

  // Configuration (Roles)
  const [userRole, setUserRole] = useState('')

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

  // Fetch Data
  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setStats(data.data.stats)
        setOngoing(data.data.ongoing)
        setUpcoming(data.data.upcoming)
        setRecentMOMs(data.data.recentMOMs)
      }
    } catch (error) {
      console.error('Failed to load dashboard', error)
    } finally {
      setLoadingConfig(false)
    }
  }

  const loadConfigs = async () => {
    try {
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserRole(payload.role)
      }

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
    }
  }

  useEffect(() => {
    if (ready && token) {
      loadDashboard()
      loadConfigs()
    }
  }, [ready, token])

  // Create Meeting Handler
  const createMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
        setNewMeeting({ date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), typeId: '', desc: '', staffIds: [], meetingAdminId: '' })
        addToast('Meeting scheduled successfully!', 'success')
        const data = await res.json()
        setTimeout(() => router.push(`/meetings/${data.data.meeting_id}`), 500)
      } else {
        const err = await res.json()
        addToast(err.message || 'Failed to create meeting', 'error')
      }
    } catch (error) {
      addToast('Network error occurred', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready || loadingConfig) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-2 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Welcome back! Overview of your meeting activities.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard delay={0} title="Total Meetings" value={stats.total} icon={<CalendarDays className="w-5 h-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard delay={100} title="Cancelled" value={stats.cancelled} icon={<Ban className="w-5 h-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard delay={200} title="Pending MOMs" value={stats.pendingMOM} icon={<FileText className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      {/* ONGOING MEETINGS */}
      {ongoing.length > 0 && (
        <div className="glass-card rounded-2xl p-6 ring-1 ring-indigo-200/30 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              Ongoing Meetings
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ongoing.map(m => (
              <Link href={`/meetings/${m.meeting_id}`} key={m.meeting_id} className="block group">
                <div className="glass-inner p-4 rounded-xl hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-wide">Happening Now</span>
                    <span className="text-xs text-muted-foreground">{new Date(m.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-indigo-600 transition-colors">{m.meeting_description || 'No Description'}</h3>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Tags className="w-3.5 h-3.5" />
                    {m.meeting_type?.meeting_type_name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* UPCOMING MEETINGS */}
        <div className="glass-card rounded-2xl p-6 animate-slide-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Meetings</h2>
            <Link href="/meetings" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">View All →</Link>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                <p>No upcoming meetings scheduled.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-medium mt-2 hover:underline">Schedule one now</button>
              </div>
            ) : (
              upcoming.map((m, i) => {
                const meetingDate = new Date(m.meeting_date)
                const endOfDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate(), 23, 59, 59)
                const isEnded = m.is_completed || (!m.is_cancelled && new Date() > endOfDay)

                return (
                  <Link
                    href={`/meetings/${m.meeting_id}`}
                    key={m.meeting_id}
                    className="block group"
                  >
                    <div className="flex items-center justify-between p-4 glass-inner rounded-xl group-hover:shadow-sm transition-all duration-200">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-white/80 rounded-xl border border-border font-bold text-foreground">
                          <span className="text-[10px] text-muted-foreground uppercase">{new Date(m.meeting_date).toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-lg leading-none">{new Date(m.meeting_date).getDate()}</span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {m.meeting_description || 'No Description'}
                            {isEnded && <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">ENDED</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(m.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-border">•</span>
                            {m.meeting_type?.meeting_type_name}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* RECENT MOMS */}
        <div className="glass-card rounded-2xl p-6 animate-slide-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Recent MOM Uploads</h2>
          </div>
          <div className="space-y-3">
            {recentMOMs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">No MOMs uploaded recently.</div>
            ) : (
              recentMOMs.map((m, i) => (
                <div key={m.meeting_id} className="flex items-center justify-between p-4 glass-inner rounded-xl hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm line-clamp-1">MOM - Meeting #{m.meeting_id}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Updated {new Date(m.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {m.document_path && (
                    <a
                      href={m.document_path.startsWith('/') ? m.document_path : `/${m.document_path}`}
                      target="_blank"
                      className="px-3.5 py-1.5 text-xs font-medium bg-white/70 backdrop-blur-sm border border-border rounded-lg hover:bg-white transition-colors"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Schedule New Meeting</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createMeeting} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newMeeting.date}
                    onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Type *</label>
                  <div className="relative">
                    <select
                      required
                      value={newMeeting.typeId}
                      onChange={e => setNewMeeting({ ...newMeeting, typeId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all appearance-none text-sm"
                    >
                      <option value="">Select Type</option>
                      {meetingTypes.map(t => (
                        <option key={t.meeting_type_id} value={t.meeting_type_id}>
                          {t.meeting_type_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-muted-foreground text-xs">▼</div>
                  </div>
                </div>

                {usersList.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Assign Meeting Admin (Optional)</label>
                    <div className="relative">
                      <select
                        value={newMeeting.meetingAdminId}
                        onChange={e => setNewMeeting({ ...newMeeting, meetingAdminId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all appearance-none text-sm"
                      >
                        <option value="">Myself</option>
                        {usersList.map(u => (
                          <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-3 pointer-events-none text-muted-foreground text-xs">▼</div>
                    </div>
                  </div>
                )}
              </div>

              {/* STAFF SELECTION */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Add Participants</label>
                <div className="max-h-40 overflow-y-auto border border-border rounded-xl p-2.5 bg-white/40 backdrop-blur-sm space-y-1.5">
                  {staffList.length === 0 ? <p className="text-xs text-muted-foreground p-2">No staff available.</p> : staffList.map(s => (
                    <label key={s.staff_id} className="flex items-center gap-2.5 p-2 hover:bg-white/60 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                        checked={newMeeting.staffIds.includes(String(s.staff_id))}
                        onChange={e => {
                          const id = String(s.staff_id)
                          const current = newMeeting.staffIds
                          setNewMeeting({
                            ...newMeeting,
                            staffIds: e.target.checked ? [...current, id] : current.filter(x => x !== id)
                          })
                        }}
                      />
                      <span className="text-sm text-foreground">{s.staff_name}</span>
                      <span className="text-xs text-muted-foreground">({s.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Description</label>
                <textarea
                  rows={3}
                  value={newMeeting.desc}
                  onChange={e => setNewMeeting({ ...newMeeting, desc: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all resize-none text-sm"
                  placeholder="What is this meeting about?"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-white/10 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-muted-foreground hover:bg-white/50 rounded-xl font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium shadow-sm shadow-indigo-500/10 transition-all disabled:opacity-70 disabled:pointer-events-none text-sm active:scale-[0.98]"
                >
                  {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Tags({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z" />
      <path d="M6 9.01V9" />
      <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
    </svg>
  )
}

function StatCard({ title, value, icon, iconBg, delay }: { title: string, value: number, icon: React.ReactNode, iconBg: string, delay: number }) {
  return (
    <div
      className="glass-card rounded-2xl p-6 flex items-center gap-5 animate-slide-in group cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  )
}
