'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Trash2, MessageSquare, ChevronDown } from 'lucide-react'

interface AttendanceRowProps {
    member: any
    isAdmin: boolean
    onToggle: (id: number, currentStatus: boolean) => void
    onRemove: (id: number) => void
    onUpdateRemark: (id: number, remark: string) => void
}

const AVATAR_COLORS = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-violet-500', 'bg-sky-500', 'bg-teal-500', 'bg-pink-500',
]

export function AttendanceRow({ member, isAdmin, onToggle, onRemove, onUpdateRemark }: AttendanceRowProps) {
    const [expanded, setExpanded] = useState(false)
    const [remark, setRemark] = useState(member.remarks || '')
    const [saving, setSaving] = useState(false)

    const name = member.staff?.staff_name || 'Unknown'
    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    const color = useMemo(() => {
        const hash = name.split('').reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0)
        return AVATAR_COLORS[hash % AVATAR_COLORS.length]
    }, [name])

    const handleSaveRemark = async () => {
        setSaving(true)
        await onUpdateRemark(member.meeting_member_id, remark)
        setSaving(false)
    }

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 md:p-5">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${color} text-white font-bold text-sm flex items-center justify-center shadow-sm`}>
                        {initials}
                    </div>
                    <div>
                        <p className="font-semibold text-foreground text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">{member.staff?.email || ''}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status Toggle */}
                    <button
                        onClick={() => onToggle(member.meeting_member_id, member.is_present)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${member.is_present
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                            : 'bg-red-50 text-red-500 border border-red-200/50'
                            }`}
                    >
                        {member.is_present ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {member.is_present ? 'Present' : 'Absent'}
                    </button>

                    {/* Remarks Toggle */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`p-2 rounded-lg transition-colors ${expanded ? 'bg-indigo-50 text-indigo-600' : 'text-muted-foreground hover:bg-white/50'}`}
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>

                    {/* Remove Button */}
                    {isAdmin && (
                        <button
                            onClick={() => onRemove(member.meeting_member_id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50/50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Expandable Remarks Section */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-1 border-t border-white/10">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Remarks</label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 border border-border px-3 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                                    placeholder="Add a note about this member..."
                                    value={remark}
                                    onChange={e => setRemark(e.target.value)}
                                />
                                <button
                                    onClick={handleSaveRemark}
                                    disabled={saving}
                                    className="bg-indigo-600 text-white px-4 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/10 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {saving ? '...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
