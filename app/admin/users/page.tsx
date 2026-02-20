'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'
import { KeyRound, AlertTriangle, X, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'

export default function AdminUsersPage() {
    const { token, ready } = useAuth()
    const { addToast } = useToast()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<number | null>(null)

    // MFA Reset State
    const [showMfaResetModal, setShowMfaResetModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [mfaResetting, setMfaResetting] = useState(false)

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'x-user-role': 'ADMIN' // Middleware usually handles token->role, relying on API logic
                }
            })
            if (res.ok) {
                const data = await res.json()
                setUsers(data.data || [])
            } else {
                // handle error or forbidden
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const updateRole = async (userId: number, newRole: string) => {
        setUpdating(userId)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, newRole })
            })
            if (res.ok) {
                // Optimistic update
                setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole } : u))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setUpdating(null)
        }
    }

    const handleResetMfa = async () => {
        if (!selectedUser) return
        setMfaResetting(true)
        try {
            const res = await fetch('/api/admin/users/reset-mfa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId: selectedUser.user_id })
            })

            const data = await res.json()

            if (res.ok) {
                addToast('MFA reset successfully', 'success')
                setShowMfaResetModal(false)
                setSelectedUser(null)
            } else {
                addToast(data.message || 'Failed to reset MFA', 'error')
            }
        } catch (error) {
            addToast('Network error', 'error')
        } finally {
            setMfaResetting(false)
        }
    }

    useEffect(() => {
        if (ready && token) fetchUsers()
    }, [ready, token])

    if (!ready || loading) return <div className="p-8">Loading users...</div>

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
                <p className="text-slate-500 mt-1">Manage system users and assign roles</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Name</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Current Role</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">2FA</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                <td className="px-6 py-4 text-slate-500">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                                            user.role === 'COMPANY_ADMIN' || user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' :
                                                user.role === 'MEMBER' ? 'bg-emerald-100 text-emerald-800' :
                                                    user.role === 'CONVENER' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-slate-100 text-slate-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.is_mfa_enabled ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            <ShieldCheck className="w-3 h-3" />
                                            Enabled
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100">
                                            <ShieldAlert className="w-3 h-3" />
                                            Disabled
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        className="border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                        value={user.role}
                                        disabled={updating === user.user_id}
                                        onChange={(e) => updateRole(user.user_id, e.target.value)}
                                    >
                                        <option value="MEMBER">Member</option>
                                        <option value="COMPANY_ADMIN">Company Admin</option>
                                        <option value="USER">User (Legacy)</option>
                                        <option value="STAFF">Staff (Legacy)</option>
                                        <option value="CONVENER">Convener (Legacy)</option>
                                        <option value="ADMIN">Admin (Legacy)</option>
                                    </select>
                                    {updating === user.user_id && <span className="ml-2 text-xs text-slate-400">Saving...</span>}

                                    {user.is_mfa_enabled && (
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setShowMfaResetModal(true)
                                            }}
                                            className="ml-4 inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100 transition-colors"
                                            title="Reset 2FA"
                                        >
                                            <KeyRound className="w-3 h-3" />
                                            Reset 2FA
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MFA Reset Modal */}
            {showMfaResetModal && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Reset 2FA</h3>
                            <button
                                onClick={() => {
                                    setShowMfaResetModal(false)
                                    setSelectedUser(null)
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-amber-900">Warning</p>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        This will disable 2FA for <strong>{selectedUser.name}</strong>. They will need to set it up again.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={() => {
                                        setShowMfaResetModal(false)
                                        setSelectedUser(null)
                                    }}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetMfa}
                                    disabled={mfaResetting}
                                    className="px-6 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm shadow-amber-500/10"
                                >
                                    {mfaResetting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Resetting...
                                        </span>
                                    ) : 'Confirm Reset'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
