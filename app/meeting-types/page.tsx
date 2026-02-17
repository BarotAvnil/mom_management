'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Tags, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'

interface MeetingType {
    meeting_type_id: number
    meeting_type_name: string
    remarks?: string
}

export default function MeetingTypesPage() {
    const { token, ready } = useAuth()
    const { addToast } = useToast()
    const [types, setTypes] = useState<MeetingType[]>([])
    const [loading, setLoading] = useState(true)

    // Create form
    const [name, setName] = useState('')
    const [remarks, setRemarks] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Edit modal
    const [editing, setEditing] = useState<MeetingType | null>(null)
    const [editName, setEditName] = useState('')
    const [editRemarks, setEditRemarks] = useState('')
    const [editSubmitting, setEditSubmitting] = useState(false)

    const fetchTypes = async () => {
        try {
            const res = await fetch('/api/meeting-type', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.data) setTypes(data.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (ready && token) fetchTypes()
    }, [ready, token])

    /* ---- CREATE ---- */
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/meeting-type', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ meetingTypeName: name.trim(), remarks: remarks.trim() })
            })
            if (!res.ok) throw new Error()
            setName('')
            setRemarks('')
            fetchTypes()
            addToast('Meeting type created', 'success')
        } catch {
            addToast('Failed to create meeting type', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    /* ---- UPDATE ---- */
    const openEdit = (type: MeetingType) => {
        setEditing(type)
        setEditName(type.meeting_type_name)
        setEditRemarks(type.remarks || '')
    }

    const handleUpdate = async () => {
        if (!editing || !editName.trim()) return
        setEditSubmitting(true)
        try {
            const res = await fetch('/api/meeting-type', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: editing.meeting_type_id, meetingTypeName: editName.trim(), remarks: editRemarks.trim() })
            })
            if (!res.ok) throw new Error()
            setEditing(null)
            fetchTypes()
            addToast('Meeting type updated', 'success')
        } catch {
            addToast('Failed to update meeting type', 'error')
        } finally {
            setEditSubmitting(false)
        }
    }

    /* ---- DELETE ---- */
    const handleDelete = async (id: number) => {
        if (!confirm('Delete this meeting type? This cannot be undone.')) return
        try {
            const res = await fetch(`/api/meeting-type?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error()
            fetchTypes()
            addToast('Meeting type deleted', 'success')
        } catch {
            addToast('Failed to delete meeting type', 'error')
        }
    }

    if (!ready || loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Meeting Types</h1>
                <p className="text-muted-foreground mt-1 text-sm">Configure the types of meetings your organization conducts</p>
            </div>

            {/* CREATE FORM */}
            <form onSubmit={handleCreate} className="glass-card rounded-2xl p-6">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Add New Type</h2>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Type Name *</label>
                        <input
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                            placeholder="e.g. Board Meeting"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Remarks</label>
                        <input
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                            placeholder="Optional description"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 h-10 px-6 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/10 disabled:opacity-50 whitespace-nowrap active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        {submitting ? 'Adding...' : 'Add Type'}
                    </button>
                </div>
            </form>

            {/* TABLE */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/40 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remarks</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                            {types.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                                            <Tags className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="font-medium text-foreground">No Meeting Types</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Add your first meeting type above.</p>
                                    </td>
                                </tr>
                            ) : (
                                types.map((type) => (
                                    <tr key={type.meeting_type_id} className="hover:bg-white/40 transition-colors group">
                                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">#{type.meeting_type_id}</td>
                                        <td className="px-6 py-4 font-semibold text-foreground">{type.meeting_type_name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{type.remarks || '—'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(type)}
                                                    className="p-2 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(type.meeting_type_id)}
                                                    className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50/50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT MODAL */}
            {editing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-foreground">Edit Meeting Type</h3>
                            <button onClick={() => setEditing(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Type Name *</label>
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Remarks</label>
                                <input
                                    value={editRemarks}
                                    onChange={e => setEditRemarks(e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                                <button onClick={() => setEditing(null)} className="px-5 py-2.5 text-muted-foreground hover:bg-white/50 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={editSubmitting || !editName.trim()}
                                    className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium shadow-sm shadow-indigo-500/10 transition-all disabled:opacity-50 text-sm active:scale-[0.98]"
                                >
                                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
