'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'

interface Staff {
  staff_id: number
  staff_name: string
  email: string
  mobile_no?: string
  remarks?: string
}

export default function StaffPage() {
  const { token, ready } = useAuth()
  const [staffList, setStaffList] = useState<Staff[]>([])

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchStaff = async () => {
    const res = await fetch('/api/staff', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setStaffList(data.data || [])
  }

  useEffect(() => {
    if (ready && token) fetchStaff()
  }, [ready, token])

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      setError('Name and Email are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, mobileNo: mobile })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to add staff')
      }

      // Success
      alert('Staff added successfully! A user account has been created with default password: "password123"') // Simple alert for now or use Toast if available

      setName('')
      setEmail('')
      setMobile('')
      fetchStaff()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex justify-between items-center border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD STAFF FORM */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-xl border border-border sticky top-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Add New Staff</h2>
            <form onSubmit={addStaff} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mobile Number</label>
                <input
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="+1 234 567 890"
                />
              </div>

              {error && <p className="text-destructive text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full"
              >
                {loading ? 'Adding...' : 'Add Staff Member'}
              </button>
            </form>
          </div>
        </div>

        {/* STAFF LIST */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => (
                    <tr key={staff.staff_id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{staff.staff_name}</div>
                        <div className="text-xs text-muted-foreground">ID: #{staff.staff_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">{staff.email}</div>
                        <div className="text-sm text-muted-foreground">{staff.mobile_no || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;
                            try {
                              const res = await fetch(`/api/staff/${staff.staff_id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) {
                                fetchStaff();
                              } else {
                                alert('Failed to delete staff');
                              }
                            } catch (e) {
                              console.error(e);
                              alert('Error deleting staff');
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Staff"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
