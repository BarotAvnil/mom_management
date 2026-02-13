
import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface Props {
    staffOptions: { value: string; label: string; subLabel?: string }[]
    onCreate: (data: { description: string; assignedTo: string; dueDate: string }) => Promise<void>
}

export function CreateActionItem({ staffOptions, onCreate }: Props) {
    const [description, setDescription] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description.trim()) return

        setLoading(true)
        await onCreate({ description, assignedTo, dueDate })
        setDescription('')
        setAssignedTo('')
        setDueDate('')
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                <input
                    placeholder="What needs to be done?"
                    className="flex-1 border border-border p-2.5 rounded-lg bg-background focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                />
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:w-64">
                    <SearchableSelect
                        options={staffOptions}
                        value={assignedTo}
                        onChange={setAssignedTo}
                        placeholder="Assign to..."
                        className="w-full"
                    />
                </div>

                <input
                    type="date"
                    className="w-full md:w-auto border border-border p-2.5 rounded-lg bg-background focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                />

                <button
                    type="submit"
                    disabled={loading || !description}
                    className="w-full md:w-auto ml-auto bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Item</>}
                </button>
            </div>
        </form>
    )
}
