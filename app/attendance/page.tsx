'use client'

import React, { JSX } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'

import { Suspense } from 'react'

function AttendanceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, ready } = useAuth()

  const [meetingId, setMeetingId] = useState('')
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* ---------------- LOAD ATTENDANCE ---------------- */
  useEffect(() => {
    if (!ready || !token) return

    const id = searchParams.get('meetingId')
    if (!id) {
      setError('Meeting ID missing')
      return
    }

    setMeetingId(id)
    fetchAttendance(id)
  }, [ready, token])

  const fetchAttendance = async (id: string) => {
    const res = await fetch(`/api/meetings/${id}/attendance`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) {
      setError('Attendance not initialized for this meeting')
      return
    }

    const data = await res.json()
    setAttendance(data.data || [])
  }

  /* ---------------- UPDATE ATTENDANCE ---------------- */
  const updateAttendance = async (
    meetingMemberId: number,
    isPresent: boolean
  ) => {
    setLoading(true)

    const res = await fetch(`/api/attendance/${meetingMemberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        isPresent: isPresent,
        remarks: ''
      })
    })

    if (!res.ok) {
      setError('Failed to update attendance')
    }

    await fetchAttendance(meetingId)
    setLoading(false)
  }

  if (!ready) {
    return <></>
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Attendance</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Staff</th>
            <th>Present</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map(a => (
            <tr key={a.meeting_member_id}>
              <td>{a.staff?.staff_name ?? 'Unknown Staff'}</td>
              <td>
                <input
                  type="checkbox"
                  checked={Boolean(a.is_present)}
                  disabled={loading}
                  onChange={e =>
                    updateAttendance(
                      a.meeting_member_id,
                      e.target.checked
                    )
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      <button onClick={() => router.push(`/mom-upload?meetingId=${meetingId}`)}>
        Continue to MOM Upload
      </button>
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttendanceContent />
    </Suspense>
  )
}
