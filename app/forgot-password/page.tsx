'use client'

import Link from 'next/link'
import { ShieldCheck, ArrowLeft, UserCog } from 'lucide-react'

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen w-full flex">
            {/* Left: Branding & Visuals */}
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
                        &quot;Security is not just about passwords; it&apos;s about peace of mind. Your administrator is here to help.&quot;
                    </blockquote>
                </div>

                <div className="relative z-10 text-sm text-zinc-500 animate-slide-up delay-200">
                    © 2024 MOM Management System. All rights reserved.
                </div>
            </div>

            {/* Right: Contact Admin Message */}
            <div className="flex-1 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md space-y-8 animate-slide-up">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
                            <UserCog className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Need to reset your password?</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            For security, password resets are managed by your <strong>Company Administrator</strong>.
                        </p>
                    </div>

                    <div className="glass-card rounded-2xl p-6 space-y-4">
                        <h2 className="font-semibold text-foreground text-sm">How to reset your password:</h2>
                        <ol className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                                <span>Contact your <strong className="text-foreground">Company Administrator</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                                <span>They will reset your password from the <strong className="text-foreground">Staff Management</strong> panel</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                                <span>Log in with your <strong className="text-foreground">new password</strong> and you&apos;re all set!</span>
                            </li>
                        </ol>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-xl text-sm">
                        <strong>Don&apos;t know your admin?</strong> Check with your team lead or HR department for help.
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
