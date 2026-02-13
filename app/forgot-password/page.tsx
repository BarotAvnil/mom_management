'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function ForgotPasswordPage() {
    const { addToast } = useToast()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.message)

            setSubmitted(true)
            addToast('Reset link sent!', 'success')

        } catch (error: any) {
            addToast(error.message || 'Something went wrong', 'error')
        } finally {
            setLoading(false)
        }
    }

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
                        "Security is not just about passwords; it's about peace of mind. Recover yours securely."
                    </blockquote>
                </div>

                <div className="relative z-10 text-sm text-zinc-500 animate-slide-up delay-200">
                    © 2024 MOM Management System. All rights reserved.
                </div>
            </div>

            {/* Right: Forgot Password Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md space-y-8 animate-slide-up">
                    <div className="text-center lg:text-left space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Forgot password?</h1>
                        <p className="text-muted-foreground">
                            No worries, we'll send you reset instructions.
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium leading-none">Email address</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="bg-secondary/30"
                                />
                            </div>

                            <Button type="submit" className="w-full h-11" disabled={loading} size="lg">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending link...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
                                If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                                <br /><br />
                                (Check the server console for the link in dev mode!)
                            </div>
                            <Button
                                variant="outline"
                                className="w-full h-11"
                                onClick={() => setSubmitted(false)}
                            >
                                Try another email
                            </Button>
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or
                            </span>
                        </div>
                    </div>

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
