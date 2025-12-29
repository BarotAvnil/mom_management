'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function ProfilePage() {
    const router = useRouter()
    const { addToast } = useToast()

    // Data
    const [user, setUser] = useState<any>(null)

    // Form
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile')
            if (res.status === 401) {
                router.push('/login')
                return
            }
            const data = await res.json()
            if (data.data) {
                setUser(data.data)
                setName(data.data.name)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password && password !== confirmPassword) {
            addToast('Passwords do not match', 'error')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    password: password || undefined
                })
            })

            if (res.ok) {
                addToast('Profile updated successfully', 'success')
                setPassword('')
                setConfirmPassword('')
                fetchProfile()
            } else {
                addToast('Failed to update profile', 'error')
            }
        } catch (error) {
            addToast('An error occurred', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!user) return (
        <div className="flex h-96 items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto mt-10 animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">My Profile</h1>

            <div className="glass-card p-8 rounded-2xl animate-slide-in">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-indigo-200">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                        <p className="text-slate-500 font-medium">{user.email}</p>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full mt-2 inline-block font-semibold uppercase tracking-wide border border-slate-200">{user.role}</span>
                    </div>
                </div>

                <form onSubmit={updateProfile} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Change Password</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                            {password && (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
