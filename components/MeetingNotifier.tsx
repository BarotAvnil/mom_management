'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useToast } from '@/components/ui/Toast'

export function MeetingNotifier() {
    const { token, ready } = useAuth()
    const { addToast } = useToast()

    // Keep track of notified meetings to avoid duplicate toasts
    const notifiedRef = useRef<Set<number>>(new Set())

    useEffect(() => {
        if (!ready || !token) return

        const checkMeetings = async () => {
            try {
                const res = await fetch('/api/dashboard/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                })

                if (!res.ok) return

                const data = await res.json()
                const upcoming = data.data?.upcoming || []

                const now = new Date()

                upcoming.forEach((meeting: any) => {
                    const meetingId = meeting.meeting_id
                    const startTime = new Date(meeting.meeting_date)

                    // Check if meeting started within the last minute or is about to start in 1 minute
                    const timeDiff = startTime.getTime() - now.getTime()
                    const isStarting = timeDiff <= 60000 && timeDiff >= -60000 // +/- 1 min window

                    if (isStarting && !notifiedRef.current.has(meetingId)) {
                        addToast(`📢 Meeting Started: ${meeting.meeting_description || 'New Meeting'}`, 'info')
                        notifiedRef.current.add(meetingId)

                        // Play a subtle sound
                        try {
                            const audio = new Audio('/notification.mp3') // Fallback if exists, or browser beep
                            // Browsers block auto-play often, so this is best-effort
                            // In a real app we might need a user interactions
                        } catch (e) {
                            // ignore audio error
                        }
                    }
                })

            } catch (error) {
                console.error('Silent notification check failed', error)
            }
        }

        // Check immediately and then every minute
        checkMeetings()
        const interval = setInterval(checkMeetings, 60000)

        return () => clearInterval(interval)
    }, [ready, token, addToast])

    return null // Headless component
}
