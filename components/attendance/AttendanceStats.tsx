'use client'

import { motion } from 'framer-motion'
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react'

interface AttendanceStatsProps {
    total: number
    present: number
    absent: number
}

export function AttendanceStats({ total, present, absent }: AttendanceStatsProps) {
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    const circumference = 2 * Math.PI * 36
    const strokeDashoffset = circumference - (rate / 100) * circumference

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
            {/* Circular Progress */}
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center">
                <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="5" fill="none" className="text-slate-100" />
                        <motion.circle
                            cx="40" cy="40" r="36"
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="none"
                            className="text-indigo-500"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">{rate}%</span>
                    </div>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-3 uppercase tracking-wider">Attendance Rate</p>
            </div>

            {/* Stat Cards */}
            <StatItem icon={<Users className="w-5 h-5 text-indigo-600" />} iconBg="bg-indigo-50" label="Total Members" value={total} delay={0.1} />
            <StatItem icon={<UserCheck className="w-5 h-5 text-emerald-600" />} iconBg="bg-emerald-50" label="Present" value={present} delay={0.2} />
            <StatItem icon={<UserX className="w-5 h-5 text-red-500" />} iconBg="bg-red-50" label="Absent" value={absent} delay={0.3} />
        </div>
    )
}

function StatItem({ icon, iconBg, label, value, delay }: { icon: React.ReactNode, iconBg: string, label: string, value: number, delay: number }) {
    return (
        <motion.div
            className="glass-card rounded-2xl p-6 flex items-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            </div>
        </motion.div>
    )
}
