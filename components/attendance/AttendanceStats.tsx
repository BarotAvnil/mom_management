'use client'

import { motion } from 'framer-motion'
import { Users, UserCheck, UserX, Percent } from 'lucide-react'

interface AttendanceStatsProps {
    total: number
    present: number
    absent: number
}

export function AttendanceStats({ total, present, absent }: AttendanceStatsProps) {
    const rate = total > 0 ? Math.round((present / total) * 100) : 0

    // Circle progress calculation
    const radius = 30
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (rate / 100) * circumference

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Rate Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 shadow-sm"
            >
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-secondary"
                        />
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            className="text-emerald-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-foreground">{rate}%</span>
                    </div>
                </div>
                <div>
                    <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Attendance Rate</span>
                    <p className="text-sm text-foreground">Based on {total} invited</p>
                </div>
            </motion.div>

            {/* Total */}
            <StatCard
                label="Total Invited"
                value={total}
                icon={<Users className="w-5 h-5 text-indigo-500" />}
                className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20"
                delay={0.1}
            />

            {/* Present */}
            <StatCard
                label="Present"
                value={present}
                icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
                className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20"
                delay={0.2}
            />

            {/* Absent */}
            <StatCard
                label="Absent"
                value={absent}
                icon={<UserX className="w-5 h-5 text-rose-500" />}
                className="bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20"
                delay={0.3}
            />
        </div>
    )
}

function StatCard({ label, value, icon, className, delay = 0 }: { label: string, value: number, icon: React.ReactNode, className?: string, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
            className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm ${className}`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{label}</span>
                {icon}
            </div>
            <div className="text-3xl font-bold text-foreground tracking-tight">
                <Counter value={value} />
            </div>
        </motion.div>
    )
}

function Counter({ value }: { value: number }) {
    return (
        <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            key={value}
        >
            {value}
        </motion.span>
    )
}
