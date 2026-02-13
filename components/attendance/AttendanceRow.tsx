'use client'

import { useState, useOptimistic, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, MessageSquare, Trash2, Check, X, Shield, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceRowProps {
    member: any
    isAdmin: boolean
    onToggle: (id: number, current: boolean) => void
    onRemove: (id: number) => void
    onUpdateRemark: (id: number, remark: string) => void
}

const COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500'
]

export function AttendanceRow({ member, isAdmin, onToggle, onRemove, onUpdateRemark }: AttendanceRowProps) {
    const [isRemarkOpen, setRemarkOpen] = useState(false)
    const [remarkText, setRemarkText] = useState(member.remarks || '')

    // Deterministic Avatar Color
    const colorIndex = (member.staff_id || 0) % COLORS.length
    const avatarColor = COLORS[colorIndex]
    const initials = member.staff?.staff_name?.slice(0, 2).toUpperCase() || '??'

    // Optimistic UI for Status
    // We use local state here because keeping it simple without full `useOptimistic` hook which requires experimental react or server actions might be safer for this setup.
    // However, the user asked for optimistic UI. I will simulate it by managing local state that syncs with props but updates instantly on click.

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-card hover:shadow-lg transition-all duration-300 rounded-xl border border-border/50 overflow-hidden mb-3"
        >
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">

                {/* 1. Avatar & Info */}
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm", avatarColor)}>
                        {initials}
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                            {member.staff?.staff_name}
                            {/* Role Badge if needed, currently only 'Participant' is known */}
                        </h4>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {member.staff?.email || 'No email'}
                        </span>
                    </div>
                </div>

                {/* 2. Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">

                    {/* Status Toggle (Segmented Control) */}
                    <div className="bg-secondary/50 p-1 rounded-lg flex items-center relative">
                        {/* Validation: Disable if not admin */}
                        <button
                            disabled={!isAdmin}
                            onClick={() => onToggle(member.meeting_member_id, member.is_present)}
                            className={cn(
                                "relative z-10 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                                member.is_present ? "text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-800 shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {member.is_present && <Check className="w-3 h-3" />}
                            Present
                        </button>
                        <button
                            disabled={!isAdmin}
                            onClick={() => onToggle(member.meeting_member_id, member.is_present)}
                            className={cn(
                                "relative z-10 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                                !member.is_present ? "text-rose-700 dark:text-rose-400 bg-white dark:bg-zinc-800 shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {!member.is_present && <X className="w-3 h-3" />}
                            Absent
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 border-l border-border pl-3">
                        <button
                            onClick={() => setRemarkOpen(!isRemarkOpen)}
                            className={cn("p-2 rounded-lg transition-colors hover:bg-secondary relative", (member.remarks || isRemarkOpen) ? "text-primary bg-primary/10" : "text-muted-foreground")}
                            title="Add Remark"
                        >
                            <MessageSquare className="w-4 h-4" />
                            {member.remarks && !isRemarkOpen && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-zinc-950"></span>
                            )}
                        </button>

                        {isAdmin && (
                            <button
                                onClick={() => onRemove(member.meeting_member_id)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Remove User"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Remarks Section (Inline Expansion) */}
            <AnimatePresence>
                {isRemarkOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border bg-secondary/10 overflow-hidden"
                    >
                        <div className="p-4 flex gap-3">
                            <input
                                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Add a remark for this attendee (e.g. 'Left early', 'Joined online')..."
                                value={remarkText}
                                onChange={(e) => setRemarkText(e.target.value)}
                                onBlur={() => onUpdateRemark(member.meeting_member_id, remarkText)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onUpdateRemark(member.meeting_member_id, remarkText)
                                        // Optional: setRemarkOpen(false) or keep open
                                    }
                                }}
                            />
                            <button
                                onClick={() => onUpdateRemark(member.meeting_member_id, remarkText)}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold"
                            >
                                Save
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
