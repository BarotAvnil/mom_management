'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Search, Loader2, UserCog, Building2, KeyRound, AlertTriangle, X, Check, UserPlus } from 'lucide-react'

export default function UsersPage() {
    const { token, ready } = useAuth()
    const { addToast } = useToast()

    const [searchTerm, setSearchTerm] = useState('')
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searched, setSearched] = useState(false)

    // Reset Password Modal
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [resetting, setResetting] = useState(false)

    // Create User Modal
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [companies, setCompanies] = useState<any[]>([])
    const [creating, setCreating] = useState(false)
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'COMPANY_ADMIN',
        companyId: ''
    })

    useEffect(() => {
        if (ready && token) {
            handleSearch()
            fetchCompanies()
        }
    }, [ready, token])

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/super-admin/companies', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.data) setCompanies(data.data)
        } catch (error) {
            console.error('Failed to fetch companies', error)
        }
    }

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        // Allow empty search to fetch default users

        setLoading(true)
        setSearched(true)

        try {
            const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setUsers(data.data || [])
        } catch (error) {
            console.error(error)
            addToast('Search failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPassword || newPassword.length < 6) return
        if (newPassword !== confirmPassword) return

        setResetting(true)
        try {
            const res = await fetch('/api/super-admin/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: selectedUser.user_id,
                    newPassword
                })
            })

            const data = await res.json()

            if (res.ok) {
                addToast(data.message, 'success')
                setSelectedUser(null)
                setNewPassword('')
                setConfirmPassword('')
            } else {
                addToast(data.message || 'Reset failed', 'error')
            }
        } catch (error) {
            addToast('Network error', 'error')
        } finally {
            setResetting(false)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            })

            const data = await res.json()

            if (res.ok) {
                addToast('User created successfully', 'success')
                setShowCreateModal(false)
                setNewUser({ name: '', email: '', password: '', role: 'COMPANY_ADMIN', companyId: '' })
                handleSearch() // Refresh list
            } else {
                addToast(data.message || 'Failed to create user', 'error')
            }
        } catch (error) {
            addToast('Network error', 'error')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
                <p className="text-muted-foreground mt-1 text-sm">Search and manage users across all tenants</p>
            </div>

            {/* Search Bar & Actions */}
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <form onSubmit={handleSearch} className="flex gap-4 flex-1 w-full">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                        />
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600/20 rounded-xl font-medium transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                    </button>
                </form>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <UserPlus className="w-5 h-5" />
                    Create User
                </button>
            </div>

            {/* Results Table */}
            {loading ? (
                <div className="flex h-64 items-center justify-center glass-card rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : searched && (
                <div className="glass-card rounded-2xl overflow-hidden animate-slide-in">
                    {users.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-foreground">No users found</h3>
                            <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((user) => (
                                        <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                                    ${user.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                        user.role === 'COMPANY_ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                            'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.company ? (
                                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        {user.company.company_name}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground italic">No Company</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
                                                >
                                                    <KeyRound className="w-3.5 h-3.5" />
                                                    Reset Password
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Reset Password Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-foreground">Reset Password</h3>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleResetPassword} className="p-6 space-y-5">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-amber-900">Confirm Action</p>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        You are resetting the password for <strong>{selectedUser.name}</strong>. Their existing session may remain active until expiry.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border rounded-xl outline-none transition-all ${confirmPassword && confirmPassword !== newPassword
                                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
                                        : 'border-border focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300'
                                        }`}
                                    placeholder="Confirm new password"
                                />
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedUser(null)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetting || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm shadow-indigo-500/10"
                                >
                                    {resetting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Resetting...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Check className="w-3.5 h-3.5" />
                                            Reset Password
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-foreground">Create New User</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white/50 hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-4 py-2 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full px-4 py-2 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="COMPANY_ADMIN">Company Admin</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                        <option value="MEMBER">Member</option>
                                    </select>
                                </div>

                                {/* Show Company Select only if NOT Super Admin */}
                                {newUser.role !== 'SUPER_ADMIN' && (
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5 tracking-wider">Company</label>
                                        <select
                                            required={newUser.role !== 'SUPER_ADMIN'}
                                            value={newUser.companyId}
                                            onChange={e => setNewUser({ ...newUser, companyId: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="">Select Company</option>
                                            {companies.map(c => (
                                                <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm shadow-indigo-500/10"
                                >
                                    {creating ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Creating...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Create User
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
