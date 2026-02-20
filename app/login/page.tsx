'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // MFA State
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [tempToken, setTempToken] = useState('')

  const router = useRouter()
  const { addToast } = useToast()

  const handleLoginSuccess = (data: any) => {
    localStorage.setItem('token', data.token)
    addToast('Welcome back!', 'success')
    // SUPER_ADMIN goes to their dedicated panel, not the tenant dashboard
    if (data.user?.role === 'SUPER_ADMIN') {
      router.push('/super-admin')
    } else {
      router.push('/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (res.ok) {
        if (data.mfaRequired) {
          setTempToken(data.tempToken)
          setMfaRequired(true)
          addToast('Please enter your 2FA code', 'info')
        } else {
          handleLoginSuccess(data)
        }
      } else {
        addToast(data.message || 'Login failed', 'error')
      }
    } catch (error) {
      addToast('Network error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/mfa/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: mfaCode })
      })
      const data = await res.json()

      if (res.ok) {
        handleLoginSuccess(data)
      } else {
        addToast(data.message || 'Verification failed', 'error')
      }
    } catch (error) {
      addToast('Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 relative overflow-hidden p-12 flex-col justify-between">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full border-2 border-white" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="MOM Logo" className="w-12 h-12 object-contain rounded-xl shadow-md border border-white/20 bg-white/10 backdrop-blur-sm" />
            <span className="text-white/90 text-xl font-bold tracking-tight">MOM Mgmt</span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Enterprise Meeting<br />Minutes Management
          </h2>
          <p className="text-indigo-200 mt-4 text-lg leading-relaxed max-w-md">
            Streamline your meeting workflows, track action items, and maintain accountability across your organization.
          </p>

          <div className="flex gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-indigo-300 text-sm mt-1">Uptime</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-indigo-300 text-sm mt-1">Companies</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50k+</div>
              <div className="text-indigo-300 text-sm mt-1">Meetings</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-indigo-300 text-sm">
          © 2026 MOM Management. Enterprise Edition.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background bg-dot-pattern">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img src="/logo.png" alt="MOM Logo" className="w-14 h-14 object-contain rounded-xl mx-auto shadow-lg shadow-indigo-500/25" />
            <h2 className="text-2xl font-bold text-foreground mt-4">MOM Mgmt</h2>
          </div>

          <div className="glass rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                {mfaRequired ? 'Two-Factor Authentication' : 'Welcome back'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {mfaRequired ? 'Enter the code from your authenticator app' : 'Sign in to your account to continue'}
              </p>
            </div>

            {mfaRequired ? (
              <form onSubmit={handleMfaSubmit} className="space-y-5">
                <div>
                  <input
                    type="text"
                    required
                    className="w-full text-center text-2xl font-mono tracking-widest py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-200 bg-white"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-sm shadow-indigo-500/10 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMfaRequired(false)}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                    />
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                    <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-white/60 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all text-sm"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-sm shadow-indigo-500/10 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {!mfaRequired && (
              <div className="mt-6 text-center text-sm text-muted-foreground space-y-1.5">
                <div>
                  Want to register your company?{' '}
                  <Link href="/register-company" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
                    Register Company
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
