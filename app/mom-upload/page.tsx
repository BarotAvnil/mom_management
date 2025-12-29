'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MOMUploadPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const [meetingId, setMeetingId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ✅ Run only on client AFTER hydration
  useEffect(() => {
    setMounted(true)
    const t = localStorage.getItem('token')
    if (!t) {
      router.push('/login')
    } else {
      setToken(t)
    }
  }, [])

  // ⛔ Prevent render until client is ready
  if (!mounted) return null

  const uploadMOM = async () => {
    if (!file || !meetingId) {
      setError('Meeting ID and file are required')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(
      `/api/meetings/${meetingId}/mom`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      }
    )

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || 'Upload failed')
      setLoading(false)
      return
    }

    setMessage('MOM uploaded successfully')
    setLoading(false)
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>MOM Upload</h2>

      <input
        placeholder="Meeting ID"
        value={meetingId}
        onChange={e => setMeetingId(e.target.value)}
      />
      <br /><br />

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={e =>
          setFile(e.target.files?.[0] || null)
        }
      />
      <br /><br />

      <button onClick={uploadMOM} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload MOM'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && (
        <p style={{ color: 'green' }}>{message}</p>
      )}
    </div>
  )
}
