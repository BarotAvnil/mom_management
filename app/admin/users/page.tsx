'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'

export default function AdminUsersPage() {
    const { token, ready } = useAuth()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<number | null>(null)

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
                                        ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'CONVENER' ? 'bg-blue-100 text-blue-800' :
                                                'bg-slate-100 text-slate-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        className="border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                        value={user.role}
                                        disabled={updating === user.user_id}
                                        onChange={(e) => updateRole(user.user_id, e.target.value)}
                                    >
                                        <option value="USER">User</option>
                                        <option value="STAFF">Staff</option>
                                        <option value="CONVENER">Convener</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    {updating === user.user_id && <span className="ml-2 text-xs text-slate-400">Saving...</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
