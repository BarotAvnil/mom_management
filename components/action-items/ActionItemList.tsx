'use client'

import { Check, Trash2, User, CalendarClock, FileText } from 'lucide-react'

interface ActionItem {
    action_item_id: number
    description: string
    assigned_to_staff?: { staff_name: string }
    due_date?: string
    is_completed: boolean
}

interface ActionItemListProps {
    items: ActionItem[]
    onToggle: (id: number, status: boolean) => void
    onDelete: (id: number) => void
}

export function ActionItemList({ items, onToggle, onDelete }: ActionItemListProps) {
    if (items.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl glass-card">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No Action Items Yet</h3>
                <p className="text-sm max-w-sm mx-auto mt-2">Create action items to track follow-ups and tasks arising from this meeting.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {items.map((item, i) => (
                <div
                    key={item.action_item_id}
                    className={`glass-card rounded-2xl p-5 flex items-start justify-between gap-4 animate-slide-in transition-all ${item.is_completed ? 'opacity-60' : ''}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <button
                            onClick={() => onToggle(item.action_item_id, item.is_completed)}
                            className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.is_completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-border hover:border-indigo-400'
                                }`}
                        >
                            {item.is_completed && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {item.description}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                {item.assigned_to_staff && (
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {item.assigned_to_staff.staff_name}
                                    </span>
                                )}
                                {item.due_date && (
                                    <span className="flex items-center gap-1">
                                        <CalendarClock className="w-3 h-3" />
                                        {new Date(item.due_date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onDelete(item.action_item_id)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50/50 p-2 rounded-lg transition-colors flex-shrink-0"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    )
}
