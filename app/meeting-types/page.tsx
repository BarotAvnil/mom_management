'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'

interface MeetingType {
    meeting_type_id: number
    meeting_type_name: string
    remarks?: string
}

export default function MeetingTypesPage() {
    const { token, ready } = useAuth()
    const [types, setTypes] = useState<MeetingType[]>([])
    const [name, setName] = useState('')
    const [remarks, setRemarks] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchTypes = async () => {
        try {
            const res = await fetch('/api/meeting-type', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.data) setTypes(data.data)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        if (ready && token) fetchTypes()
    }, [ready, token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/meeting-type', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ meetingTypeName: name, remarks })
            })

            if (!res.ok) throw new Error('Failed to create meeting type')

            setName('')
            setRemarks('')
            fetchTypes()
        } catch (err) {
            setError('Failed to create meeting type')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Meeting Types</h1>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Type</h2>
                <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type Name</label>
                        <input
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Client Meeting"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                        <input
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Optional description"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Adding...' : 'Add Type'}
                    </button>
                </form>
                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-sm font-semibold text-slate-700">ID</th>
                            <th className="px-6 py-3 text-sm font-semibold text-slate-700">Name</th>
                            <th className="px-6 py-3 text-sm font-semibold text-slate-700">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {types.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                    No meeting types found. Add one above.
                                </td>
                            </tr>
                        ) : (
                            types.map((type) => (
                                <tr key={type.meeting_type_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600">#{type.meeting_type_id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{type.meeting_type_name}</td>
                                    <td className="px-6 py-4 text-slate-600">{type.remarks || '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
