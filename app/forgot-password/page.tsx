'use client'

import Link from 'next/link'
import { ShieldCheck, ArrowLeft, UserCog } from 'lucide-react'

export default function ForgotPasswordPage() {
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

            {/* Right Panel - Content */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background bg-dot-pattern">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-10">
                        <img src="/logo.png" alt="MOM Logo" className="w-14 h-14 object-contain rounded-xl mx-auto shadow-lg shadow-indigo-500/25" />
                        <h2 className="text-2xl font-bold text-foreground mt-4">MOM Mgmt</h2>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-xl space-y-8 border border-slate-200">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
                                <UserCog className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Need a password reset?</h1>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                For security, password resets are managed by your <strong className="text-slate-900">Company Administrator</strong>.
                            </p>
                        </div>

                        <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-xl p-6 space-y-4 shadow-sm">
                            <h2 className="font-semibold text-slate-900 text-sm">How to reset your password:</h2>
                            <ol className="space-y-4 text-sm text-slate-600">
                                <li className="flex items-start gap-4">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5 border border-indigo-200">1</span>
                                    <span className="mt-1">Contact your <strong className="text-slate-900 tracking-wide font-semibold">Company Administrator</strong></span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5 border border-indigo-200">2</span>
                                    <span className="mt-1">They will reset your password from the <strong className="text-slate-900 tracking-wide font-semibold">Staff Management</strong> panel</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5 border border-indigo-200">3</span>
                                    <span className="mt-1">Log in with your <strong className="text-slate-900 tracking-wide font-semibold">new password</strong> and you&apos;re all set!</span>
                                </li>
                            </ol>
                        </div>

                        <div className="p-4 bg-indigo-50/80 border border-indigo-200/50 text-indigo-700 rounded-xl text-xs flex gap-3 items-start">
                            <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p><strong>Don&apos;t know your admin?</strong> Check with your team lead or HR department for help accessing your account.</p>
                        </div>

                        <div className="pt-2 text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors group"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                Back to sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
