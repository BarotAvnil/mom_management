'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'
import { UserPlus, Pencil, Trash2, X, Users, Mail, Phone, Loader2, Search, KeyRound, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'

interface Staff {
  staff_id: number
  staff_name: string
  email: string
  mobile_no?: string
  remarks?: string
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-violet-500', 'bg-sky-500', 'bg-teal-500', 'bg-pink-500',
]

export default function StaffPage() {
  const { token, ready } = useAuth()
  const { addToast } = useToast()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Create form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [createRemarks, setCreateRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit modal
  const [editing, setEditing] = useState<Staff | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editMobile, setEditMobile] = useState('')
  const [editRemarks, setEditRemarks] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Reset password modal
  const [resettingStaff, setResettingStaff] = useState<Staff | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [showResetPass, setShowResetPass] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setStaffList(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ready && token) fetchStaff()
  }, [ready, token])

  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staffList
    const q = searchTerm.toLowerCase()
    return staffList.filter(s =>
      s.staff_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.mobile_no || '').includes(q)
    )
  }, [staffList, searchTerm])

  /* ---- CREATE ---- */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      addToast('Name and Email are required', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), mobileNo: mobile.trim(), remarks: createRemarks.trim() })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed')
      }
      setName('')
      setEmail('')
      setMobile('')
      setCreateRemarks('')
      fetchStaff()
      addToast('Staff added! Default password: password123', 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to add staff', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---- UPDATE ---- */
  const openEdit = (staff: Staff) => {
    setEditing(staff)
    setEditName(staff.staff_name)
    setEditEmail(staff.email)
    setEditMobile(staff.mobile_no || '')
    setEditRemarks(staff.remarks || '')
  }

  const handleUpdate = async () => {
    if (!editing || !editName.trim()) return
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/staff/${editing.staff_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim(), mobileNo: editMobile.trim(), remarks: editRemarks.trim() })
      })
      if (!res.ok) throw new Error()
      setEditing(null)
      fetchStaff()
      addToast('Staff updated successfully', 'success')
    } catch {
      addToast('Failed to update staff', 'error')
    } finally {
      setEditSubmitting(false)
    }
  }

  /* ---- DELETE ---- */
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this staff member? This may remove their meeting attendance records.')) return
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message)
      }
      fetchStaff()
      addToast('Staff deleted', 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to delete staff', 'error')
    }
  }

  /* ---- RESET PASSWORD ---- */
  const passwordChecks = {
    length: resetPassword.length >= 6,
  }
  const allChecksPassed = resetPassword.length >= 6
  const strengthScore = resetPassword.length >= 8 ? 4 : resetPassword.length >= 6 ? 2 : 0
  const strengthLabel = strengthScore < 2 ? 'Too Short' : strengthScore < 4 ? 'Good' : 'Strong'
  const strengthColor = strengthScore < 2 ? 'bg-red-500' : strengthScore < 4 ? 'bg-amber-500' : 'bg-emerald-500'

  const handleResetPassword = async () => {
    if (!resettingStaff || !allChecksPassed) return
    if (resetPassword !== resetConfirm) {
      addToast('Passwords do not match', 'error')
      return
    }
    setResetSubmitting(true)
    try {
      const res = await fetch(`/api/staff/${resettingStaff.staff_id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: resetPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setResettingStaff(null)
      setResetPassword('')
      setResetConfirm('')
      setShowResetPass(false)
      setShowResetConfirm(false)
      addToast(`Password reset for ${resettingStaff.staff_name}`, 'success')
    } catch (err: any) {
      addToast(err.message || 'Failed to reset password', 'error')
    } finally {
      setResetSubmitting(false)
    }
  }

  const getAvatarColor = (name: string) => {
    const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_COLORS[hash % AVATAR_COLORS.length]
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (!ready || loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your organization&apos;s staff members</p>
        </div>
        <div className="relative w-full md:w-64">
          <input
            placeholder="Search staff..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CREATE FORM */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-6 sticky top-8">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add New Staff
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Mobile</label>
                <input
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Remarks</label>
                <input
                  value={createRemarks}
                  onChange={e => setCreateRemarks(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                  placeholder="Optional notes"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/10 disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? 'Adding...' : 'Add Staff Member'}
              </button>
            </form>
          </div>
        </div>

        {/* STAFF LIST */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/40 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="font-medium text-foreground">No Staff Members</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {searchTerm ? 'No results match your search.' : 'Add your first staff member using the form.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff, i) => (
                      <tr key={staff.staff_id} className="hover:bg-white/40 transition-colors group animate-slide-in" style={{ animationDelay: `${i * 30}ms` }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${getAvatarColor(staff.staff_name)} text-white font-bold text-xs flex items-center justify-center shadow-sm`}>
                              {getInitials(staff.staff_name)}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{staff.staff_name}</div>
                              <div className="text-[11px] text-muted-foreground font-mono">#{staff.staff_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-foreground text-sm">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            {staff.email}
                          </div>
                          {staff.mobile_no && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1">
                              <Phone className="w-3 h-3" />
                              {staff.mobile_no}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setResettingStaff(staff); setResetPassword(''); setResetConfirm(''); setShowResetPass(false); setShowResetConfirm(false) }}
                              className="p-2 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50/50 transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(staff)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(staff.staff_id)}
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
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Edit Staff Member</h3>
              <button onClick={() => setEditing(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Mobile</label>
                <input value={editMobile} onChange={e => setEditMobile(e.target.value)} className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Remarks</label>
                <input value={editRemarks} onChange={e => setEditRemarks(e.target.value)} className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm" placeholder="Optional" />
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

      {/* RESET PASSWORD MODAL */}
      {resettingStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-foreground">Reset Password</h3>
                <p className="text-xs text-muted-foreground mt-0.5">For {resettingStaff.staff_name}</p>
              </div>
              <button onClick={() => setResettingStaff(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* New Password */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">New Password *</label>
                <div className="relative">
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowResetPass(!showResetPass)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showResetConfirm ? 'text' : 'password'}
                    value={resetConfirm}
                    onChange={e => setResetConfirm(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowResetConfirm(!showResetConfirm)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    {showResetConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetConfirm && resetPassword !== resetConfirm && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Passwords do not match</p>
                )}
              </div>

              {/* Password Strength */}
              {resetPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Strength</span>
                    <span className={`text-xs font-bold ${strengthScore <= 1 ? 'text-red-500' : strengthScore <= 2 ? 'text-amber-500' : strengthScore <= 3 ? 'text-sky-500' : 'text-emerald-500'}`}>{strengthLabel}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strengthColor}`} style={{ width: `${(strengthScore / 4) * 100}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Minimum 6 characters required.
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button onClick={() => setResettingStaff(null)} className="px-5 py-2.5 text-muted-foreground hover:bg-white/50 rounded-xl font-medium transition-colors text-sm">Cancel</button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetSubmitting || !allChecksPassed || resetPassword !== resetConfirm || !resetConfirm}
                  className="px-6 py-2.5 bg-amber-600 text-white hover:bg-amber-700 rounded-xl font-medium shadow-sm shadow-amber-500/10 transition-all disabled:opacity-50 text-sm active:scale-[0.98]"
                >
                  {resetSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
