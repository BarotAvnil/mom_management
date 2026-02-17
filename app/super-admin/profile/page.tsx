'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { User, Mail, Shield, Eye, EyeOff } from 'lucide-react'

export default function SuperAdminProfilePage() {
    const router = useRouter()
    const { addToast } = useToast()

    const [user, setUser] = useState<any>(null)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
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

        if (password && password.length < 6) {
            addToast('Password must be at least 6 characters', 'error')
            return
        }

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

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
    }

    if (!user) return (
        <div className="flex h-96 items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
                <p className="text-muted-foreground mt-1 text-sm">Manage your account settings and security</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ─── INFO CARD ─── */}
                <div className="md:col-span-1 space-y-6">
                    <div className="glass-card rounded-2xl p-6 text-center">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-indigo-300/30 mb-4">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-red-50 border-red-200 text-red-700">
                                🛡️ Super Admin
                            </span>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3 text-left">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                {user.email}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Shield className="w-4 h-4 text-slate-400" />
                                System Administrator
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── SETTINGS FORM ─── */}
                <div className="md:col-span-2">
                    <div className="glass-card rounded-2xl p-8">
                        <form onSubmit={updateProfile} className="space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Personal Information
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name</label>
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Security
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full px-4 py-2.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                                placeholder="Leave blank to keep current"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    {password && (
                                        <div className="animate-fade-in">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all ${confirmPassword && confirmPassword !== password
                                                    ? 'border-red-300 focus:border-red-400'
                                                    : confirmPassword ? 'border-emerald-300 focus:border-emerald-400' : 'border-slate-200 focus:border-indigo-500'
                                                    }`}
                                                placeholder="Confirm new password"
                                            />
                                            {confirmPassword && confirmPassword !== password && (
                                                <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-xs text-slate-400">
                                    Account created · {formatDate(user.created_at)}
                                </p>
                                <button
                                    type="submit"
                                    disabled={loading || (!name.trim() && !password)}
                                    className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </span>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
