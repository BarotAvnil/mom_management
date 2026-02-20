'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, User, Mail, Lock, Loader2, ArrowRight, CheckCircle } from 'lucide-react'

export default function RegisterCompanyPage() {
    const router = useRouter()
    const [companyName, setCompanyName] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName, assistantName: name, email, password })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed')
            }

            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Success State
    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background bg-dot-pattern p-8">
                <div className="glass rounded-2xl p-10 max-w-md w-full text-center shadow-xl animate-slide-up">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Request Submitted!</h2>
                    <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                        Your company registration is under review. You&apos;ll be notified once a Super Admin approves your request.
                    </p>
                    <Link
                        href="/login"
                        className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/10 active:scale-[0.98]"
                    >
                        Back to Login
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            {/* Left Panel - Brand */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 relative overflow-hidden p-12 flex-col justify-between">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 rounded-full border-2 border-white" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full border border-white" />
                    <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="MOM Logo" className="w-12 h-12 object-contain rounded-xl shadow-md border border-white/20 bg-white/10 backdrop-blur-sm" />
                        <span className="text-white/90 text-xl font-bold tracking-tight">MOM Mgmt</span>
                    </div>
                </div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-bold text-white leading-tight">
                        Register Your<br />Company
                    </h2>
                    <p className="text-indigo-200 mt-4 text-lg leading-relaxed max-w-md">
                        Get started with enterprise meeting management. Submit your registration and our team will review your request.
                    </p>

                    <div className="mt-10 space-y-3">
                        {['Submit registration', 'Super Admin reviews', 'Get approved & start'].map((step, i) => (
                            <div key={i} className="flex items-center gap-3 text-indigo-200">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">{i + 1}</div>
                                <span className="text-sm">{step}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 text-indigo-300 text-sm">© 2026 MOM Management. Enterprise Edition.</div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background bg-dot-pattern">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="lg:hidden text-center mb-10">
                        <img src="/logo.png" alt="MOM Logo" className="w-14 h-14 object-contain rounded-xl mx-auto shadow-lg shadow-indigo-500/25" />
                        <h2 className="text-2xl font-bold text-foreground mt-4">Register Company</h2>
                    </div>

                    <div className="glass rounded-2xl p-8 shadow-xl">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-foreground">Company Registration</h1>
                            <p className="text-muted-foreground text-sm mt-1">Fill in your details to get started</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Company Name *</label>
                                <div className="relative">
                                    <input
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        placeholder="Acme Corporation"
                                    />
                                    <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Your Full Name *</label>
                                <div className="relative">
                                    <input
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Jane Doe"
                                    />
                                    <User className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address *</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="jane@acme.com"
                                    />
                                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Password *</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                    />
                                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-500 text-sm font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-sm shadow-indigo-500/10 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit Registration <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
