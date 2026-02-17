'use client'

import { useState } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Plus } from 'lucide-react'

interface CreateActionItemProps {
    staffOptions: { value: string; label: string; subLabel?: string }[]
    onCreate: (data: { description: string; assignedToStaffId?: number; dueDate?: string }) => Promise<void>
}

export function CreateActionItem({ staffOptions, onCreate }: CreateActionItemProps) {
    const [description, setDescription] = useState('')
    const [assignedStaffId, setAssignedStaffId] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!description.trim()) return
        setLoading(true)
        await onCreate({
            description: description.trim(),
            assignedToStaffId: assignedStaffId ? Number(assignedStaffId) : undefined,
            dueDate: dueDate || undefined,
        })
        setDescription('')
        setAssignedStaffId('')
        setDueDate('')
        setLoading(false)
    }

    return (
        <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Create Action Item</h3>

            <div className="flex flex-col md:flex-row gap-3">
                <input
                    className="flex-1 border border-border px-3.5 py-2.5 rounded-xl text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                    placeholder="What needs to be done?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />

                <div className="w-full md:w-56">
                    <SearchableSelect
                        options={staffOptions}
                        value={assignedStaffId}
                        onChange={setAssignedStaffId}
                        placeholder="Assign to..."
                    />
                </div>

                <input
                    type="date"
                    className="w-full md:w-40 border border-border px-3.5 py-2.5 rounded-xl text-sm bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition-all"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                />

                <button
                    onClick={handleSubmit}
                    disabled={!description.trim() || loading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-500/10 disabled:opacity-50 whitespace-nowrap active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    Add Item
                </button>
            </div>
        </div>
    )
}
