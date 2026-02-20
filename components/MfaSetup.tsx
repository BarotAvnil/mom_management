'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import QRCode from 'qrcode'
import { Copy, Loader2, ShieldCheck, Smartphone } from 'lucide-react'

export default function MfaSetup({ onComplete, isEnabled = false }: { onComplete?: () => void, isEnabled?: boolean }) {
    const { addToast } = useToast()
    const [step, setStep] = useState<'initial' | 'setup' | 'verify'>('initial')
    const [secret, setSecret] = useState('')
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (step === 'setup') {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
        }
    }, [step])

    // Reset to initial if isEnabled changes (though usually page reload handles this)
    // If enabled, we show the "Active" state

    const startSetup = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/mfa/setup', { method: 'POST' })
            const data = await res.json()

            if (res.ok) {
                setSecret(data.secret)
                const url = await QRCode.toDataURL(data.otpauth)
                setQrCodeUrl(url)
                setStep('setup')
            } else {
                addToast(data.message || 'Failed to start setup', 'error')
            }
        } catch (error) {
            addToast('Network error', 'error')
        } finally {
            setLoading(false)
        }
    }

    const verifyCode = async () => {
        if (!code || code.length !== 6) {
            addToast('Please enter a valid 6-digit code', 'error')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/mfa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            })
            const data = await res.json()

            if (res.ok) {
                addToast(data.message || 'MFA enabled successfully', 'success')
                setStep('initial')
                if (onComplete) onComplete()
                // Force reload or state update would be needed here in parent, 
                // but for now we just rely on parent re-rendering or user reload.
                // Ideally we should call a parent callback to update `isEnabled`.
                window.location.reload() // Simple way to refresh state
            } else {
                addToast(data.message || 'Verification failed', 'error')
            }
        } catch (error) {
            addToast('Network error', 'error')
        } finally {
            setLoading(false)
        }
    }

    const copySecret = () => {
        navigator.clipboard.writeText(secret)
        addToast('Secret copied to clipboard', 'success')
    }

    if (isEnabled && step === 'initial') {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide mb-1">Two-Factor Authentication is Active</h3>
                        <p className="text-sm text-emerald-700 mb-2">
                            Your account is secured with 2FA. You will be asked for a verification code when logging in.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (step === 'initial') {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1">Two-Factor Authentication</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Add an extra layer of security to your account. You will need to enter a code from your authenticator app when logging in.
                        </p>
                        <button
                            onClick={startSetup}
                            disabled={loading}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Enable 2FA
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    Setup Authenticator App
                </h3>
                <button
                    onClick={() => setStep('initial')}
                    className="text-xs text-slate-400 hover:text-slate-600"
                >
                    Cancel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="text-sm text-slate-600 space-y-2">
                        <p>1. Install an authenticator app (Google Authenticator, Authy, etc.) on your phone.</p>
                        <p>2. Scan the QR code below.</p>
                    </div>
                    {qrCodeUrl && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-sm">
                            <img src={qrCodeUrl} alt="MFA QR Code" className="w-40 h-40 mix-blend-multiply" />
                        </div>
                    )}
                    <div className="text-xs text-slate-500">
                        Can&apos;t scan? <button onClick={copySecret} className="text-indigo-600 font-medium hover:underline flex items-center gap-1 inline-flex"><Copy className="w-3 h-3" /> Copy setup key</button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-slate-600">
                        <p>3. Enter the 6-digit code from your app to verify setup.</p>
                    </div>
                    <div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    verifyCode()
                                }
                            }}
                            placeholder="000000"
                            className="w-full text-center text-2xl font-mono tracking-widest py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-200 bg-white"
                        />
                    </div>
                    <button
                        onClick={verifyCode}
                        disabled={loading || code.length !== 6}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Enable'}
                    </button>
                </div>
            </div>
        </div>
    )
}
