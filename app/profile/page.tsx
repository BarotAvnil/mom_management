'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { User, Mail, Shield, Building2, Calendar, CheckCircle2, Clock, TrendingUp, FileText, AlertCircle, Briefcase, Eye, EyeOff } from 'lucide-react'
import MfaSetup from '@/components/MfaSetup'

export default function ProfilePage() {
    const router = useRouter()
    const { addToast } = useToast()

    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState<any>(null)
    const [recentMeetings, setRecentMeetings] = useState<any[]>([])
    const [actionItems, setActionItems] = useState<any[]>([])

    // Form
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')

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
            if (data.stats) setStats(data.stats)
            if (data.recentMeetings) setRecentMeetings(data.recentMeetings)
            if (data.actionItems) setActionItems(data.actionItems)
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

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return { bg: 'bg-red-50 border-red-200 text-red-700', icon: '🛡️', label: 'Super Admin' }
            case 'COMPANY_ADMIN':
                return { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', icon: '👑', label: 'Company Admin' }
            case 'ADMIN':
                return { bg: 'bg-purple-50 border-purple-200 text-purple-700', icon: '⚙️', label: 'Admin' }
            case 'CONVENER':
                return { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: '📋', label: 'Convener' }
            case 'MEMBER':
                return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: '👤', label: 'Member' }
            default:
                return { bg: 'bg-slate-50 border-slate-200 text-slate-700', icon: '👤', label: role }
        }
    }

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
    }

    const formatDateTime = (d: string) => {
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const getDaysUntil = (d: string) => {
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: 'text-red-600' }
        if (diff === 0) return { text: 'Due today', color: 'text-amber-600' }
        if (diff <= 3) return { text: `${diff}d left`, color: 'text-amber-600' }
        return { text: `${diff}d left`, color: 'text-slate-500' }
    }

    if (!user) return (
        <div className="flex h-96 items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    )

    const roleBadge = getRoleBadge(user.role)

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20">
            {/* ─── HERO CARD ─── */}
            <div className="glass-card rounded-2xl p-8 animate-slide-in">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-indigo-300/30">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                                <Mail className="w-3.5 h-3.5" />
                                {user.email}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${roleBadge.bg}`}>
                                {roleBadge.icon} {roleBadge.label}
                            </span>
                        </div>
                    </div>
                    {user.company && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                            <Building2 className="w-4 h-4 text-indigo-500" />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{user.company.company_name}</p>
                                {user.company.domain && (
                                    <p className="text-xs text-slate-500">{user.company.domain}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── TAB SWITCH ─── */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                {(['overview', 'settings'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t === 'overview' ? '📊 Overview' : '⚙️ Settings'}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                    {/* ─── STATS GRID ─── */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <StatCard
                                icon={<Calendar className="w-5 h-5" />}
                                label="Meetings Created"
                                value={stats.meetingsCreated}
                                color="indigo"
                            />
                            <StatCard
                                icon={<CheckCircle2 className="w-5 h-5" />}
                                label="Meetings Attended"
                                value={stats.meetingsAttended}
                                color="emerald"
                            />
                            <StatCard
                                icon={<User className="w-5 h-5" />}
                                label="Meetings Invited"
                                value={stats.meetingsInvited}
                                color="blue"
                            />
                            <StatCard
                                icon={<TrendingUp className="w-5 h-5" />}
                                label="Attendance Rate"
                                value={`${stats.attendanceRate}%`}
                                color="purple"
                            />
                            <StatCard
                                icon={<Clock className="w-5 h-5" />}
                                label="Pending Actions"
                                value={stats.pendingActions}
                                color="amber"
                            />
                            <StatCard
                                icon={<CheckCircle2 className="w-5 h-5" />}
                                label="Completed Actions"
                                value={stats.completedActions}
                                color="teal"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ─── RECENT MEETINGS ─── */}
                        <div className="glass-card rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                Recent Meetings
                            </h3>
                            {recentMeetings.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">No meetings yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentMeetings.map(m => (
                                        <button
                                            key={m.meeting_id}
                                            onClick={() => router.push(`/meetings/${m.meeting_id}`)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left group"
                                        >
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.is_cancelled ? 'bg-red-400' : m.is_completed ? 'bg-emerald-400' : 'bg-indigo-400'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                                    {m.meeting_description || 'Untitled Meeting'}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {formatDateTime(m.meeting_date)}
                                                    {m.meeting_type && ` · ${m.meeting_type.meeting_type_name}`}
                                                </p>
                                            </div>
                                            {m.is_cancelled && (
                                                <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">Cancelled</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ─── PENDING ACTION ITEMS ─── */}
                        <div className="glass-card rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                Pending Action Items
                            </h3>
                            {actionItems.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">All caught up! No pending items.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {actionItems.map(item => {
                                        const due = item.due_date ? getDaysUntil(item.due_date) : null
                                        return (
                                            <div key={item.action_item_id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                                                <div className="w-5 h-5 rounded-full border-2 border-amber-300 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800">{item.description}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {item.meeting?.meeting_description && (
                                                            <span className="text-xs text-slate-400 truncate">
                                                                <FileText className="w-3 h-3 inline mr-1" />
                                                                {item.meeting.meeting_description}
                                                            </span>
                                                        )}
                                                        {due && (
                                                            <span className={`text-xs font-medium ${due.color}`}>
                                                                <Clock className="w-3 h-3 inline mr-1" />
                                                                {due.text}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── ACCOUNT INFO ─── */}
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-500" />
                            Account Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={user.name} />
                            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email Address" value={user.email} />
                            <InfoRow icon={<Shield className="w-4 h-4" />} label="Role" value={roleBadge.label} />
                            <InfoRow icon={<Building2 className="w-4 h-4" />} label="Company" value={user.company?.company_name || 'N/A'} />
                            {user.company?.domain && (
                                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Domain" value={user.company.domain} />
                            )}
                            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Member Since" value={formatDate(user.created_at)} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-2xl animate-fade-in space-y-8">
                    {/* MFA SECTION */}
                    <MfaSetup isEnabled={user.is_mfa_enabled} />

                    <div className="glass-card p-8 rounded-2xl">
                        <form onSubmit={updateProfile} className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Personal Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name</label>
                                        <input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                                        <input
                                            value={user.email}
                                            disabled
                                            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact your admin.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Security</h3>
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
                                        {password && (
                                            <div className="mt-2 animate-fade-in">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${password.length >= i * 3
                                                            ? password.length >= 12 ? 'bg-emerald-500' : password.length >= 8 ? 'bg-amber-500' : 'bg-red-400'
                                                            : 'bg-slate-200'
                                                            }`} />
                                                    ))}
                                                </div>
                                                <p className={`text-xs mt-1 ${password.length >= 12 ? 'text-emerald-600' : password.length >= 8 ? 'text-amber-600' : password.length >= 6 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {password.length < 6 ? 'Too short (min 6 chars)' : password.length < 8 ? 'Fair' : password.length < 12 ? 'Good' : 'Strong'}
                                                </p>
                                            </div>
                                        )}
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

                            <div className="pt-4 flex items-center justify-between">
                                <p className="text-xs text-slate-400">
                                    Last updated · {formatDate(user.created_at)}
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
            )}
        </div>
    )
}

/* ─── SUB-COMPONENTS ─── */

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        teal: 'bg-teal-50 text-teal-600 border-teal-100',
    }

    return (
        <div className={`rounded-2xl p-4 border ${colors[color] || colors.indigo} transition-all hover:shadow-sm hover:-translate-y-0.5`}>
            <div className="flex items-center gap-2 mb-2 opacity-80">{icon}</div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mt-0.5">{label}</p>
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="text-slate-400">{icon}</div>
            <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-slate-800">{value}</p>
            </div>
        </div>
    )
}
