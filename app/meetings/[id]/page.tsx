'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'

export default function MeetingDetailsPage() {
    const { id: meetingIdParam } = useParams()
    const meetingId = String(meetingIdParam)
    const router = useRouter()
    const { token, ready } = useAuth()

    // Data
    const [meeting, setMeeting] = useState<any>(null)
    const [members, setMembers] = useState<any[]>([])
    const [staffList, setStaffList] = useState<any[]>([])
    const [meetingTypes, setMeetingTypes] = useState<any[]>([])
    const [user, setUser] = useState<any>(null) // Current User

    // State
    const [loading, setLoading] = useState(false)
    const [tab, setTab] = useState<'details' | 'attendance' | 'mom'>('details')

    // Forms
    const [selectedStaffId, setSelectedStaffId] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [editMode, setEditMode] = useState(false)

    // Edit Form
    const [editData, setEditData] = useState({ description: '', date: '', typeId: '', isCancelled: false, reason: '' })

    // Permission Check
    const isAdmin = user && meeting && (
        user.user_id === meeting.created_by ||
        user.user_id === meeting.meeting_admin_id ||
        user.role === 'ADMIN'
    )

    /* ---------------- LOAD DATA ---------------- */
    const fetchUser = async () => {
        const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.data) setUser(data.data)
    }

    const fetchAll = async () => {
        if (!token) return

        // Fetch permissions
        fetchUser()

        // Meeting
        const mRes = await fetch(`/api/meetings/${meetingId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!mRes.ok) {
            router.push('/dashboard')
            return
        }
        const mData = await mRes.json()
        setMeeting(mData.data)
        setEditData({
            description: mData.data.meeting_description || '',
            date: mData.data.meeting_date ? new Date(mData.data.meeting_date).toISOString().slice(0, 16) : '',
            typeId: mData.data.meeting_type_id,
            isCancelled: mData.data.is_cancelled,
            reason: mData.data.cancellation_reason || ''
        })

        // Members
        fetchMembers()

        // Configs
        const sRes = await fetch('/api/staff', { headers: { Authorization: `Bearer ${token}` } })
        const sData = await sRes.json()
        setStaffList(sData.data || [])

        const tRes = await fetch('/api/meeting-type', { headers: { Authorization: `Bearer ${token}` } })
        const tData = await tRes.json()
        setMeetingTypes(tData.data || [])
    }

    const fetchMembers = async () => {
        const memRes = await fetch(`/api/meetings/${meetingId}/attendance`, { headers: { Authorization: `Bearer ${token}` } })
        const memData = await memRes.json()
        setMembers(memData.data || [])
    }

    useEffect(() => {
        if (ready && token) fetchAll()
    }, [ready, token])

    /* ---------------- ACTIONS ---------------- */

    // 1. Update Meeting
    const updateMeeting = async () => {
        setLoading(true)
        await fetch(`/api/meetings/${meetingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                meetingDate: editData.date,
                meetingTypeId: editData.typeId,
                description: editData.description,
                isCancelled: editData.isCancelled,
                cancellationReason: editData.reason
            })
        })
        setEditMode(false)
        fetchAll()
        setLoading(false)
    }

    // 2. Add Member
    const addMember = async () => {
        if (!selectedStaffId) return
        setLoading(true)
        await fetch(`/api/meetings/${meetingId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ staffId: selectedStaffId })
        })
        setSelectedStaffId('')
        fetchMembers()
        setLoading(false)
    }

    // 3. Toggle Attendance
    const toggleAttendance = async (memberId: number, currentStatus: boolean) => {
        // Current API uses PUT /api/attendance/{meeting_member_id} but based on file structure earlier check 
        // Wait, earlier file viewed `attendance/page.tsx` used `/api/attendance/{id}`. 
        // I need to verify that API exists. `api/attendance/route.ts` vs `api/attendance/[id]/route.ts`. 
        // I listed `api` earlier and saw `attendance` dir.
        // Assuming `api/attendance/[id]` exists. I'll blindly implemented it, if fails I fix.

        // Update: I haven't modified attendance API. It was there from start.

        await fetch(`/api/attendance/${memberId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isPresent: !currentStatus }) // Toggle (true/false)
        })
        fetchMembers()
    }

    // 4. Upload MOM
    const uploadMOM = async () => {
        if (!file) return
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        await fetch(`/api/meetings/${meetingId}/mom`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        })
        setFile(null)
        fetchAll()
        setLoading(false)
    }

    // 5. Remove Member
    const removeMember = async (memberId: number) => {
        if (!confirm('Remove this staff member from the meeting?')) return // Safety check
        setLoading(true)
        await fetch(`/api/attendance/${memberId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        })
        fetchMembers()
        setLoading(false)
    }

    // 6. Delete Meeting
    const deleteMeeting = async () => {
        if (!confirm('Are you sure you want to DELETE this meeting? This cannot be undone.')) return
        setLoading(true)
        const res = await fetch(`/api/meetings/${meetingId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
            router.push('/meetings') // Redirect to list
        } else {
            alert('Failed to delete meeting')
            setLoading(false)
        }
    }

    if (!ready || !meeting) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800">← Back</button>
                        <h1 className="text-2xl font-bold text-slate-900">Meeting Details</h1>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs px-2">#{meetingId}</span>
                        {meeting.is_cancelled && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">CANCELLED</span>}
                    </div>
                    {!editMode && <p className="text-slate-600 mt-2 text-lg">{meeting.meeting_description || 'No Description'}</p>}
                </div>
                <div className="flex gap-2">
                    {!editMode && isAdmin && (
                        <button onClick={() => setEditMode(true)} className="bg-background border border-border px-4 py-2 rounded-lg text-sm hover:bg-secondary transition-colors font-medium">Edit Details</button>
                    )}
                    {editMode && (
                        <>
                            <button onClick={() => setEditMode(false)} className="bg-secondary text-muted-foreground px-4 py-2 rounded-lg text-sm transition-colors hover:text-foreground">Cancel</button>
                            <button onClick={deleteMeeting} className="bg-background text-destructive border border-destructive/20 px-4 py-2 rounded-lg text-sm hover:bg-destructive/5 transition-colors">Delete Meeting</button>
                            <button onClick={updateMeeting} disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm shadow hover:opacity-90 transition-all">Save Changes</button>
                        </>
                    )}
                </div>
            </div>

            {/* EDIT FORM */}
            {editMode && (
                <div className="bg-card p-6 rounded-xl border border-border grid grid-cols-2 gap-4 animate-fade-in">
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                        <input className="w-full border border-border p-2.5 rounded-lg mt-1 bg-secondary/30 focus:ring-1 focus:ring-primary outline-none" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                        <input type="datetime-local" className="w-full border border-border p-2.5 rounded-lg mt-1 bg-secondary/30 focus:ring-1 focus:ring-primary outline-none" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase">Type</label>
                        <select className="w-full border border-border p-2.5 rounded-lg mt-1 bg-secondary/30 focus:ring-1 focus:ring-primary outline-none" value={editData.typeId} onChange={e => setEditData({ ...editData, typeId: e.target.value })}>
                            {meetingTypes.map(t => <option key={t.meeting_type_id} value={t.meeting_type_id}>{t.meeting_type_name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2 border-t border-border pt-4 mt-2">
                        <label className="flex items-center gap-2 text-destructive font-bold text-sm">
                            <input type="checkbox" checked={editData.isCancelled} onChange={e => setEditData({ ...editData, isCancelled: e.target.checked })} className="rounded border-border text-destructive focus:ring-destructive" />
                            Cancel Meeting?
                        </label>
                        {editData.isCancelled && (
                            <input placeholder="Cancellation Reason" className="w-full border border-destructive/20 p-2 rounded mt-2 bg-destructive/5 text-destructive placeholder:text-destructive/50" value={editData.reason} onChange={e => setEditData({ ...editData, reason: e.target.value })} />
                        )}
                    </div>
                </div>
            )}

            {/* TABS */}
            <div className="border-b border-border flex gap-6">
                <button onClick={() => setTab('details')} className={`pb-3 text-sm font-medium transition-colors ${tab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Overview</button>
                <button onClick={() => setTab('attendance')} className={`pb-3 text-sm font-medium transition-colors ${tab === 'attendance' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Attendance ({members.length})</button>
                <button onClick={() => setTab('mom')} className={`pb-3 text-sm font-medium transition-colors ${tab === 'mom' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>MOM Document</button>
            </div>

            {/* TAB CONTENT */}
            <div>
                {tab === 'details' && (
                    <div className="bg-card p-6 rounded-xl border border-border animate-slide-in">
                        <div className="grid grid-cols-2 gap-y-6 text-sm">
                            <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Date</span>
                                <span className="font-medium text-lg">{new Date(meeting.meeting_date).toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Type</span>
                                <span className="font-medium text-lg">{meeting.meeting_type?.meeting_type_name || 'General'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Status</span>
                                <span className={`font-medium inline-flex items-center gap-1.5 ${meeting.is_cancelled ? 'text-destructive' : 'text-emerald-600'}`}>
                                    <span className={`w-2 h-2 rounded-full ${meeting.is_cancelled ? 'bg-destructive' : 'bg-emerald-600'}`}></span>
                                    {meeting.is_cancelled ? 'Cancelled' : 'Scheduled'}
                                </span>
                            </div>
                            {meeting.is_cancelled && (
                                <div className="col-span-2 bg-destructive/5 p-4 rounded-lg border border-destructive/10 text-destructive text-sm mt-2">
                                    <span className="font-bold block mb-1">Reason for cancellation:</span>
                                    {meeting.cancellation_reason}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'attendance' && (
                    <div className="space-y-6 animate-slide-in">
                        {/* Add Member - Admins Only */}
                        {isAdmin && (
                            <div className="flex gap-2">
                                <select className="border border-border p-2.5 rounded-lg flex-1 bg-background text-sm focus:ring-1 focus:ring-primary outline-none" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}>
                                    <option value="">Select Staff to Add</option>
                                    {staffList.filter(s => !members.find(m => m.staff_id === s.staff_id)).map(s => (
                                        <option key={s.staff_id} value={s.staff_id}>{s.staff_name} ({s.email})</option>
                                    ))}
                                </select>
                                <button onClick={addMember} disabled={!selectedStaffId} className="bg-primary text-primary-foreground px-6 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">Add</button>
                            </div>
                        )}

                        {/* List */}
                        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Staff Name</th>
                                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance</th>
                                        {isAdmin && <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {members.map(m => (
                                        <tr key={m.meeting_member_id} className="hover:bg-secondary/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">{m.staff?.staff_name}</td>
                                            <td className="px-6 py-4 text-muted-foreground text-sm">Participant</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    disabled={!isAdmin}
                                                    onClick={() => toggleAttendance(m.meeting_member_id, m.is_present)}
                                                    className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${m.is_present ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'} ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                >
                                                    {m.is_present ? 'Present' : 'Absent'}
                                                </button>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => removeMember(m.meeting_member_id)}
                                                        className="text-muted-foreground hover:text-destructive p-2 hover:bg-destructive/10 rounded-lg transition-all"
                                                        title="Remove from meeting"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'mom' && (
                    <div className="bg-card p-12 rounded-xl border border-border text-center animate-slide-in">
                        {meeting.document_path ? (
                            <div className="py-2">
                                <div className="text-4xl mb-4 opacity-80">📄</div>
                                <h3 className="text-lg font-bold text-foreground">MOM Document Available</h3>
                                <p className="text-muted-foreground mb-6 text-sm">Uploaded on {new Date(meeting.updated_at).toLocaleDateString()}</p>
                                <a href={meeting.document_path} target="_blank" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg shadow-sm hover:translate-y-[-2px] transition-all inline-block font-medium text-sm">Download Document</a>
                            </div>
                        ) : (
                            <div className="py-2">
                                <div className="text-4xl mb-4 text-border">☁️</div>
                                <h3 className="text-lg font-bold text-foreground">No Document Uploaded</h3>
                                <p className="text-muted-foreground mb-8 text-sm max-w-xs mx-auto">Upload the minutes of meeting file here to share with participants.</p>

                                <div className="max-w-md mx-auto flex gap-2">
                                    <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="border border-border p-2 rounded-lg w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80" accept=".pdf,.doc,.docx" />
                                    <button onClick={uploadMOM} disabled={!file || loading} className="bg-primary text-primary-foreground px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">Upload</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
