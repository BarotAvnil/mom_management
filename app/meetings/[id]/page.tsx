'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { AttendanceStats } from '@/components/attendance/AttendanceStats'
import { AttendanceRow } from '@/components/attendance/AttendanceRow'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useToast } from '@/components/ui/Toast'
import { Loader2, ArrowLeft, Calendar, Tag, Shield, FileText, CheckCircle2, XCircle, Video, CheckSquare, Users } from 'lucide-react';
import { ActionItemList } from '@/components/action-items/ActionItemList'
import { CreateActionItem } from '@/components/action-items/CreateActionItem'

export default function MeetingDetailsPage() {
    const { id: meetingIdParam } = useParams()
    const meetingId = String(meetingIdParam)
    const router = useRouter()
    const { token, ready } = useAuth()
    const { addToast } = useToast()

    // Data
    const [meeting, setMeeting] = useState<any>(null)
    const [members, setMembers] = useState<any[]>([])
    const [staffList, setStaffList] = useState<any[]>([])
    const [meetingTypes, setMeetingTypes] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)

    // State
    const [loading, setLoading] = useState(false)
    const [tab, setTab] = useState<'details' | 'attendance' | 'mom' | 'actions'>('details')
    const [actionItems, setActionItems] = useState<any[]>([])

    // Forms
    const [selectedStaffId, setSelectedStaffId] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [editMode, setEditMode] = useState(false)

    // Edit Form
    const [editData, setEditData] = useState({ description: '', date: '', typeId: '', isCancelled: false, reason: '', meetingLink: '' })

    // Permission Check
    const isAdmin = user && meeting && (
        user.user_id === meeting.created_by ||
        user.user_id === meeting.meeting_admin_id ||
        user.role === 'ADMIN' ||
        user.role === 'COMPANY_ADMIN'
    )

    /* ---------------- LOAD DATA ---------------- */
    const fetchUser = async () => {
        const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.data) setUser(data.data)
    }

    const fetchAll = async () => {
        if (!token) return
        fetchUser()

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
            reason: mData.data.cancellation_reason || '',
            meetingLink: mData.data.meeting_link || ''
        })

        fetchMembers()

        const sRes = await fetch('/api/staff', { headers: { Authorization: `Bearer ${token}` } })
        const sData = await sRes.json()
        setStaffList(sData.data || [])

        const tRes = await fetch('/api/meeting-type', { headers: { Authorization: `Bearer ${token}` } })
        const tData = await tRes.json()
        setMeetingTypes(tData.data || [])

        fetchActionItems()
    }

    const fetchActionItems = async () => {
        const res = await fetch(`/api/action-items?meetingId=${meetingId}`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        setActionItems(data.data || [])
    }

    const fetchMembers = async () => {
        const memRes = await fetch(`/api/meetings/${meetingId}/attendance`, { headers: { Authorization: `Bearer ${token}` } })
        const memData = await memRes.json()
        setMembers(memData.data || [])
    }

    useEffect(() => {
        if (ready && token) fetchAll()
    }, [ready, token])

    /* ---------------- HELPER FOR STATS ---------------- */
    const stats = useMemo(() => {
        const total = members.length
        const present = members.filter(m => m.is_present).length
        const absent = total - present
        return { total, present, absent }
    }, [members])

    /* ---------------- ACTIONS ---------------- */
    const updateMeeting = async () => {
        if (editData.isCancelled && editData.reason.trim().length < 10) {
            alert('Cancellation reason must be at least 10 characters long to explain why.')
            return
        }
        setLoading(true)
        try {
            await fetch(`/api/meetings/${meetingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    meetingDate: editData.date,
                    meetingTypeId: editData.typeId,
                    description: editData.description,
                    isCancelled: editData.isCancelled,
                    cancellationReason: editData.reason,
                    meetingLink: editData.meetingLink
                })
            })
            setEditMode(false)
            fetchAll()
            addToast('Meeting details updated', 'success')
        } catch (e) {
            addToast('Failed to update meeting', 'error')
        }
        setLoading(false)
    }

    const addMember = async () => {
        if (!selectedStaffId) return
        setLoading(true)
        try {
            await fetch(`/api/meetings/${meetingId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ staffId: selectedStaffId })
            })
            setSelectedStaffId('')
            fetchMembers()
            addToast('Member added successfully', 'success')
        } catch (e) {
            addToast('Failed to add member', 'error')
        }
        setLoading(false)
    }

    const toggleAttendance = async (memberId: number, currentStatus: boolean) => {
        const previousMembers = [...members]
        setMembers(prev => prev.map(m => m.meeting_member_id === memberId ? { ...m, is_present: !currentStatus } : m))
        try {
            const res = await fetch(`/api/attendance/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isPresent: !currentStatus })
            })
            if (!res.ok) throw new Error()
        } catch (e) {
            setMembers(previousMembers)
            addToast('Failed to update attendance', 'error')
        }
    }

    const updateRemark = async (memberId: number, remark: string) => {
        const previousMembers = [...members]
        setMembers(prev => prev.map(m => m.meeting_member_id === memberId ? { ...m, remarks: remark } : m))
        try {
            const res = await fetch(`/api/attendance/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ remarks: remark })
            })
            if (!res.ok) throw new Error()
            addToast('Remark saved', 'success')
        } catch (e) {
            setMembers(previousMembers)
            addToast('Failed to save remark', 'error')
        }
    }

    const uploadMOM = async () => {
        if (!file) return
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)
        try {
            await fetch(`/api/meetings/${meetingId}/mom`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            })
            setFile(null)
            fetchAll()
            addToast('MOM document uploaded', 'success')
        } catch (e) {
            addToast('Failed to upload MOM', 'error')
        }
        setLoading(false)
    }

    const removeMember = async (memberId: number) => {
        if (!confirm('Remove this staff member from the meeting?')) return
        setLoading(true)
        try {
            await fetch(`/api/attendance/${memberId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            fetchMembers()
            addToast('Member removed', 'success')
        } catch (e) {
            addToast('Failed to remove member', 'error')
        }
        setLoading(false)
    }

    const deleteMeeting = async () => {
        if (!confirm('Are you sure you want to DELETE this meeting? This cannot be undone.')) return
        setLoading(true)
        const res = await fetch(`/api/meetings/${meetingId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
            router.push('/meetings')
        } else {
            addToast('Failed to delete meeting', 'error')
            setLoading(false)
        }
        setLoading(false)
    }

    const endMeeting = async () => {
        const presentCount = members.filter(m => m.is_present).length
        if (presentCount === 0) {
            const proceed = confirm('⚠️ No attendance marked!\n\nEveryone will be marked as ABSENT.\n\nAre you sure you want to end the meeting?')
            if (!proceed) return
        }
        if (!meeting.document_path) {
            const proceed = confirm('⚠️ No MOM document uploaded.\n\nDo you want to end anyway?')
            if (!proceed) return
        }
        setLoading(true)
        await fetch(`/api/meetings/${meetingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isCompleted: true })
        })
        fetchAll()
        setLoading(false)
    }

    const createActionItem = async (data: any) => {
        try {
            await fetch('/api/action-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...data, meetingId })
            })
            fetchActionItems()
            addToast('Action item created', 'success')
        } catch (e) {
            addToast('Failed to create action item', 'error')
        }
    }

    const toggleActionItem = async (id: number, status: boolean) => {
        setActionItems(prev => prev.map(i => i.action_item_id === id ? { ...i, is_completed: !status } : i))
        try {
            await fetch(`/api/action-items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isCompleted: !status })
            })
        } catch (e) {
            fetchActionItems()
            addToast('Failed to update status', 'error')
        }
    }

    const deleteActionItem = async (id: number) => {
        if (!confirm('Delete this action item?')) return
        try {
            await fetch(`/api/action-items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            fetchActionItems()
            addToast('Action item deleted', 'success')
        } catch (e) {
            addToast('Failed to delete item', 'error')
        }
    }


    if (!ready || !meeting) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>

    const staffOptions = staffList
        .filter(s => !members.find(m => m.staff_id === s.staff_id))
        .map(s => ({ value: String(s.staff_id), label: s.staff_name, subLabel: s.email }))

    // All staff for action item assignment (not filtered by membership)
    const allStaffOptions = staffList
        .map(s => ({ value: String(s.staff_id), label: s.staff_name, subLabel: s.email }))

    const tabs = [
        { id: 'details' as const, label: 'Overview' },
        { id: 'attendance' as const, label: 'Attendance', count: members.length },
        { id: 'mom' as const, label: 'MOM Document' },
        { id: 'actions' as const, label: 'Action Items', count: actionItems.filter(i => !i.is_completed).length },
    ]

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-2 md:p-8 animate-fade-in pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-white/50 transition-colors text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Meeting Details</h1>
                        <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-medium">#{meetingId}</span>
                        {meeting.is_cancelled && <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-bold">CANCELLED</span>}
                    </div>
                </div>
                {meeting.meeting_link && !editMode && (
                    <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 md:mt-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-500/10 font-medium transition-all active:scale-[0.98]"
                    >
                        <Video className="w-4 h-4" />
                        Join Meeting
                    </a>
                )}
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {!editMode && isAdmin && (
                        <button onClick={() => setEditMode(true)} className="bg-white/60 backdrop-blur-sm border border-border px-4 py-2 rounded-xl text-sm hover:bg-white/80 transition-all font-medium">Edit Details</button>
                    )}
                    {editMode && (
                        <>
                            <button onClick={() => setEditMode(false)} className="bg-white/50 text-muted-foreground px-4 py-2 rounded-xl text-sm transition-colors hover:text-foreground">Cancel</button>
                            <button onClick={deleteMeeting} className="bg-white/60 text-red-600 border border-red-200/50 px-4 py-2 rounded-xl text-sm hover:bg-red-50/50 transition-colors">Delete Meeting</button>
                            <button onClick={updateMeeting} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm shadow-sm shadow-indigo-500/10 hover:bg-indigo-700 transition-all active:scale-[0.98]">Save Changes</button>
                        </>
                    )}
                    {!editMode && isAdmin && !meeting.is_cancelled && !meeting.is_completed && (
                        <button onClick={endMeeting} disabled={loading} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm shadow-sm hover:bg-emerald-700 transition-all font-medium active:scale-[0.98]">End Meeting</button>
                    )}
                </div>
            </div>

            {/* EDIT FORM */}
            {editMode && (
                <div className="glass-card rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
                        <input className="w-full border border-border p-3 rounded-xl bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
                        <input type="datetime-local" className="w-full border border-border p-3 rounded-xl bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Type</label>
                        <select className="w-full border border-border p-3 rounded-xl bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all" value={editData.typeId} onChange={e => setEditData({ ...editData, typeId: e.target.value })}>
                            {meetingTypes.map(t => <option key={t.meeting_type_id} value={t.meeting_type_id}>{t.meeting_type_name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            Video Meeting Link
                        </label>
                        <input
                            placeholder="e.g., https://meet.google.com/abc-defg-hij"
                            className="w-full border border-border p-3 rounded-xl bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                            value={editData.meetingLink}
                            onChange={e => setEditData({ ...editData, meetingLink: e.target.value })}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 border-t border-white/10 pt-4">
                        <label className="flex items-center gap-2 text-red-600 font-bold text-sm">
                            <input type="checkbox" checked={editData.isCancelled} onChange={e => setEditData({ ...editData, isCancelled: e.target.checked })} className="rounded border-red-300 text-red-600 focus:ring-red-500 w-4 h-4" />
                            Cancel Meeting?
                        </label>
                        {editData.isCancelled && (
                            <input placeholder="Cancellation Reason (Required)" className="w-full border border-red-200/50 p-3 rounded-xl mt-3 bg-red-50/30 text-red-700 placeholder:text-red-400 focus:ring-2 focus:ring-red-500/30 outline-none transition-all" value={editData.reason} onChange={e => setEditData({ ...editData, reason: e.target.value })} />
                        )}
                    </div>
                </div>
            )}

            {/* INFO CARD (Read Only) */}
            {!editMode && (
                <div className="glass-card rounded-2xl p-6">
                    <p className="text-lg text-foreground mb-6 leading-relaxed">{meeting.meeting_description || 'No Description'}</p>
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium text-foreground">{new Date(meeting.meeting_date).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Tag className="w-4 h-4" />
                            <span className="font-medium text-foreground">{meeting.meeting_type?.meeting_type_name || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            {meeting.is_completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : meeting.is_cancelled ? <XCircle className="w-4 h-4 text-red-500" /> : <div className="w-4 h-4 rounded-full border-2 border-indigo-400/50" />}
                            <span className={`font-medium ${meeting.is_cancelled ? 'text-red-600' : meeting.is_completed ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                {meeting.is_cancelled ? 'Cancelled' : meeting.is_completed ? 'Completed' : new Date() > new Date(meeting.meeting_date) ? 'In Progress' : 'Scheduled'}
                            </span>
                        </div>
                    </div>
                    {meeting.is_cancelled && (
                        <div className="mt-4 bg-red-50/50 border border-red-100 p-4 rounded-xl text-red-700 text-sm">
                            <span className="font-bold block mb-1">Cancellation Reason:</span>
                            {meeting.cancellation_reason}
                        </div>
                    )}
                </div>
            )}

            {/* TABS */}
            <div>
                <div className="glass-card rounded-2xl p-1.5 flex gap-1 mb-6">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${tab === t.id
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                                }`}
                        >
                            {t.label}
                            {t.count !== undefined && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT */}
                <div className="min-h-[400px]">
                    {tab === 'details' && (
                        <div className="text-center py-20 text-muted-foreground glass-card rounded-2xl border-2 border-dashed">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                                <CheckSquare className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="font-medium text-foreground">Detailed overview integrated above</h3>
                            <p className="text-sm mt-1">Use the edit button to manage meeting details.</p>
                        </div>
                    )}

                    {tab === 'attendance' && (
                        <div className="space-y-8 animate-fade-in">
                            <AttendanceStats total={stats.total} present={stats.present} absent={stats.absent} />

                            {isAdmin && (
                                <div className="flex flex-col sm:flex-row gap-4 p-4 glass-card rounded-2xl">
                                    <div className="flex-1">
                                        <SearchableSelect
                                            options={staffOptions}
                                            value={selectedStaffId}
                                            onChange={setSelectedStaffId}
                                            placeholder="Select staff to invite..."
                                            className="w-full"
                                        />
                                    </div>
                                    <button
                                        onClick={addMember}
                                        disabled={!selectedStaffId || loading}
                                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/10 disabled:opacity-50 whitespace-nowrap active:scale-[0.98]"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Add Member'}
                                    </button>
                                </div>
                            )}

                            <div className="space-y-4">
                                {members.length === 0 ? (
                                    <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl glass-card">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 text-muted-foreground/40" />
                                        </div>
                                        <h3 className="text-lg font-medium text-foreground">No Participants Yet</h3>
                                        <p className="text-sm max-w-sm mx-auto mt-2">Add staff members to this meeting to track attendance and share MOM documents.</p>
                                    </div>
                                ) : (
                                    members.map(member => (
                                        <AttendanceRow
                                            key={member.meeting_member_id}
                                            member={member}
                                            isAdmin={!!isAdmin}
                                            onToggle={toggleAttendance}
                                            onRemove={removeMember}
                                            onUpdateRemark={updateRemark}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'mom' && (
                        <div className="glass-card p-12 rounded-2xl text-center animate-fade-in">
                            {meeting.document_path ? (
                                <div className="py-6">
                                    <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <FileText className="w-10 h-10 text-indigo-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Minutes of Meeting Available</h3>
                                    <p className="text-muted-foreground mb-8 text-sm">
                                        Document verified and uploaded on <span className="font-medium text-foreground">{new Date(meeting.updated_at).toLocaleDateString()}</span>
                                    </p>
                                    <a href={meeting.document_path} target="_blank" className="bg-indigo-600 text-white px-8 py-3 rounded-xl shadow-md shadow-indigo-500/10 hover:bg-indigo-700 hover:shadow-lg transition-all inline-flex items-center gap-2 font-medium active:scale-[0.98]">
                                        Download Document
                                    </a>
                                </div>
                            ) : (
                                <div className="py-6">
                                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-dashed border-muted-foreground/20">
                                        <FileText className="w-10 h-10 text-muted-foreground/30" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">No Document Uploaded</h3>
                                    <p className="text-muted-foreground mb-8 text-sm max-w-xs mx-auto">Upload the minutes of meeting file (PDF, DOCX) here to share with all participants.</p>

                                    <div className="max-w-md mx-auto flex gap-3">
                                        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="flex-1 border border-border p-2.5 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 bg-white/60 backdrop-blur-sm cursor-pointer" accept=".pdf,.doc,.docx" />
                                        <button onClick={uploadMOM} disabled={!file || loading} className="bg-indigo-600 text-white px-6 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm shadow-indigo-500/10 active:scale-[0.98]">Upload</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {tab === 'actions' && (
                        <div className="space-y-6 animate-fade-in">
                            <CreateActionItem
                                staffOptions={allStaffOptions}
                                onCreate={async (data) => await createActionItem(data)}
                            />
                            <ActionItemList
                                items={actionItems}
                                onToggle={toggleActionItem}
                                onDelete={deleteActionItem}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
