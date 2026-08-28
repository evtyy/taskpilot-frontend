import type { TaskPriority } from "../types/task";

export interface TaskDraft {
    title: string;
    description: string;
    priority: TaskPriority;
    due_date: string;
}

interface TaskFieldsProps {
    draft: TaskDraft;
    onChange: (draft: TaskDraft) => void;
    autoFocus?: boolean;
}

export function TaskFields({ draft, onChange, autoFocus }: TaskFieldsProps) {
    return (
        <div className="task-fields">
            <input
                autoFocus={autoFocus}
                className="task-fields__title"
                placeholder="Task title"
                value={draft.title}
                onChange={(e) => onChange({ ...draft, title: e.target.value })}
                maxLength={120}
            />
            <textarea
                className="task-fields__desc"
                placeholder="Description (optional)"
                value={draft.description}
                onChange={(e) => onChange({ ...draft, description: e.target.value })}
                rows={2}
            />
            <div className="task-fields__row">
                <select
                    value={draft.priority}
                    onChange={(e) =>
                        onChange({ ...draft, priority: e.target.value as TaskPriority })
                    }
                >
                    <option value="low">Priority: Low</option>
                    <option value="medium">Priority: Medium</option>
                    <option value="high">Priority: High</option>
                </select>
                <input
                    type="date"
                    value={draft.due_date}
                    onChange={(e) => onChange({ ...draft, due_date: e.target.value })}
                />
            </div>
        </div>
    );
}
