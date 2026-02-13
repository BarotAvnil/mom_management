'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const { addToast } = useToast()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            addToast("Passwords don't match", 'error')
            return
        }

        if (password.length < 6) {
            addToast("Password must be at least 6 characters", 'error')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.message)

            setSuccess(true)
            addToast('Password reset successful!', 'success')
            setTimeout(() => router.push('/login'), 3000)

        } catch (error: any) {
            addToast(error.message || 'Something went wrong', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <div className="text-destructive font-medium">Invalid or missing reset token.</div>
                <Link href="/forgot-password">
                    <Button variant="outline">Request a new link</Button>
                </Link>
            </div>
        )
    }

    if (success) {
        return (
            <div className="text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Password Reset!</h2>
                    <p className="text-muted-foreground text-sm">
                        Your password has been successfully updated. Redirecting to login...
                    </p>
                </div>
                <Button onClick={() => router.push('/login')} className="w-full h-11">
                    Go to Login Now
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="pass" className="text-sm font-medium leading-none">New Password</label>
                    <Input
                        id="pass"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                        className="bg-secondary/30"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="confirm" className="text-sm font-medium leading-none">Confirm Password</label>
                    <Input
                        id="confirm"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                        className="bg-secondary/30"
                    />
                </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading} size="lg">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                    </>
                ) : (
                    'Set New Password'
                )}
            </Button>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen w-full flex">
            {/* Left: Branding & Visuals (Same as Login) */}
            <div className="hidden lg:flex w-1/2 bg-zinc-900 text-white p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent"></div>

                <div className="relative z-10 animate-fade-in">
                    <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        MOM Mgmt
                    </div>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg animate-slide-up delay-100">
                    <blockquote className="text-2xl font-medium leading-relaxed">
                        "Resetting, securing, and moving forward. Your workspace is waiting."
                    </blockquote>
                </div>

                <div className="relative z-10 text-sm text-zinc-500 animate-slide-up delay-200">
                    © 2024 MOM Management System. All rights reserved.
                </div>
            </div>

            {/* Right: Reset Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md space-y-8 animate-slide-up">
                    <div className="text-center lg:text-left space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
                        <p className="text-muted-foreground">
                            Please enter your new password below.
                        </p>
                    </div>

                    <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>

                    <div className="text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
