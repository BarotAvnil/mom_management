
import { useState } from 'react'
import { CheckCircle2, Circle, Trash2, Calendar, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'

interface ActionItem {
    action_item_id: number
    description: string
    is_completed: boolean
    due_date: string | null
    assignee: {
        staff_id: number
        staff_name: string
        email: string
    } | null
}

interface Props {
    items: ActionItem[]
    onToggle: (id: number, status: boolean) => void
    onDelete: (id: number) => void
}

export function ActionItemList({ items, onToggle, onDelete }: Props) {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-secondary/20">
                <p>No action items yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {items.map(item => (
                <div key={item.action_item_id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${item.is_completed ? 'bg-secondary/20 border-border opacity-75' : 'bg-card border-border shadow-sm'}`}>
                    <button onClick={() => onToggle(item.action_item_id, item.is_completed)} className="mt-1 text-muted-foreground hover:text-primary transition-colors">
                        {item.is_completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                    </button>

                    <div className="flex-1">
                        <p className={`text-sm font-medium ${item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.description}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                            {item.assignee && (
                                <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                                    <UserIcon className="w-3 h-3" />
                                    <span>{item.assignee.staff_name}</span>
                                </div>
                            )}
                            {item.due_date && (
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${new Date(item.due_date) < new Date() && !item.is_completed ? 'bg-red-100 text-red-700' : 'bg-secondary'}`}>
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(item.due_date).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button onClick={() => onDelete(item.action_item_id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
