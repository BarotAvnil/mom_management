'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'

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
  const [staffList, setStaffList] = useState<any[]>([]) // [NEW]
  const [usersList, setUsersList] = useState<any[]>([]) // [NEW]
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
    meetingAdminId: '' // [NEW]
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
      // Decode token for role
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserRole(payload.role)
      }

      // Meeting Types
      const tRes = await fetch('/api/meeting-type', { headers: { Authorization: `Bearer ${token}` } })
      const tData = await tRes.json()
      if (tData.data) setMeetingTypes(tData.data)

      // Staff List
      const sRes = await fetch('/api/staff', { headers: { Authorization: `Bearer ${token}` } })
      const sData = await sRes.json()
      if (sData.data) setStaffList(sData.data)

      // Users List (Potential Meeting Admins) - Attempt fetch
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
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Welcome back! Overview of your meeting activities.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <span className="mr-2 text-lg">＋</span> Schedule Meeting
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard delay={0} title="Total Meetings" value={stats.total} icon="📅" color="bg-secondary text-primary" />
        <StatCard delay={100} title="Cancelled" value={stats.cancelled} icon="🚫" color="bg-secondary text-destructive" />
        <StatCard delay={200} title="Pending MOMs" value={stats.pendingMOM} icon="📝" color="bg-secondary text-amber-600" />
      </div>

      {/* ONGOING MEETINGS (High Priority) */}
      {ongoing.length > 0 && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              Ongoing Meetings
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ongoing.map(m => (
              <Link href={`/meetings/${m.meeting_id}`} key={m.meeting_id} className="block group">
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wide">Happening Now</span>
                    <span className="text-xs text-slate-500">{new Date(m.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-indigo-700 transition-colors">{m.meeting_description || 'No Description'}</h3>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <span>🏷️ {m.meeting_type?.meeting_type_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* UPCOMING MEETINGS */}
        <div className="bg-card border border-border rounded-xl p-6 animate-slide-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Upcoming Meetings
            </h2>
            <Link href="/meetings" className="text-sm font-medium text-primary hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                <p>No upcoming meetings scheduled.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-primary font-medium mt-2 hover:underline">Schedule one now</button>
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
                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-transparent group-hover:border-border group-hover:bg-secondary transition-all duration-200">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-background rounded-md border border-border font-bold text-foreground">
                          <span className="text-[10px] text-muted-foreground uppercase">{new Date(m.meeting_date).toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-lg leading-none">{new Date(m.meeting_date).getDate()}</span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {m.meeting_description || 'No Description'}
                            {isEnded && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">ENDED</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            {new Date(m.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-border">•</span>
                            {m.meeting_type?.meeting_type_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* RECENT MOMS */}
        <div className="bg-card border border-border rounded-xl p-6 animate-slide-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Recent MOM Uploads
            </h2>
          </div>
          <div className="space-y-3">
            {recentMOMs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">No MOMs uploaded recently.</div>
            ) : (
              recentMOMs.map((m, i) => (
                <div key={m.meeting_id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-transparent hover:border-border transition-all">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      📄
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
                      className="px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-md hover:bg-secondary transition-colors"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Schedule New Meeting</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createMeeting} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newMeeting.date}
                    onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Type *</label>
                  <div className="relative">
                    <select
                      required
                      value={newMeeting.typeId}
                      onChange={e => setNewMeeting({ ...newMeeting, typeId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
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

                {/* Meeting Admin Selection (Visible if users loaded) */}
                {usersList.length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Assign Meeting Admin (Optional)</label>
                    <div className="relative">
                      <select
                        value={newMeeting.meetingAdminId}
                        onChange={e => setNewMeeting({ ...newMeeting, meetingAdminId: e.target.value })}
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
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
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Add Participants</label>
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 bg-secondary/50 space-y-2">
                  {staffList.length === 0 ? <p className="text-xs text-muted-foreground p-2">No staff available.</p> : staffList.map(s => (
                    <label key={s.staff_id} className="flex items-center gap-2 p-1.5 hover:bg-background rounded cursor-pointer transition-colors border border-transparent hover:border-border">
                      <input
                        type="checkbox"
                        className="rounded border-border text-primary focus:ring-primary"
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
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={newMeeting.desc}
                  onChange={e => setNewMeeting({ ...newMeeting, desc: e.target.value })}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                  placeholder="What is this meeting about?"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-muted-foreground hover:bg-secondary rounded-lg font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-medium shadow-sm transition-all disabled:opacity-70 disabled:pointer-events-none text-sm"
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

function StatCard({ title, value, icon, color, delay }: { title: string, value: number, icon: string, color: string, delay: number }) {
  return (
    <div
      className="bg-card border border-border p-6 rounded-xl flex items-center gap-5 animate-slide-in group cursor-default hover:shadow-sm transition-all"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      </div>
    </div>
  )
}
