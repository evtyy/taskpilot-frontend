import type {Task, TaskPriority, TaskStatus, TaskUpdate} from "../types/task";
import {useState} from "react";

interface TaskCardProps {
    task: Task;
    onStatusChange: (id: number, status: TaskStatus) => void;
    onEdit: (id: number, payload: TaskUpdate) => Promise<void>;
    onDelete: (id: number) => void;
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
    todo: "in_progress",
    in_progress: "done",
    done: null,
};

const NEXT_LABEL: Record<TaskStatus, string> = {
    todo: "mark as in progress →",
    in_progress: "mark as done →",
    done: "",
};

export function TaskCard({task, onStatusChange, onEdit, onDelete}: TaskCardProps) {
    const next = NEXT_STATUS[task.status];
    const isPending = task.id < 0; // optimistic placeholder

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        due_date: task.due_date ?? "",
    });

    function startEditing() {
        setDraft({
            title: task.title,
            description: task.description ?? "",
            priority: task.priority,
            due_date: task.due_date ?? "",
        });
        setIsEditing(true);
    }

    async function handleSave() {
        if (!draft.title.trim()) return;
        setSaving(true);
        try {
            await onEdit(task.id, {
                title: draft.title.trim(),
                description: draft.description.trim() || undefined,
                priority: draft.priority,
                due_date: draft.due_date || undefined,
            });
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    }

    if (isEditing) {
        return (
            <article className={`task-card task-card--${task.priority} task-card--editing`}>
                <input
                    autoFocus
                    className="task-card__edit-title"
                    value={draft.title}
                    onChange={(e) => setDraft({...draft, title: e.target.value})}
                    maxLength={120}
                />
                <textarea
                    className="task-card__edit-desc"
                    placeholder="description（optional）"
                    value={draft.description}
                    onChange={(e) => setDraft({...draft, description: e.target.value})}
                    rows={2}
                />
                <div className="task-form__row">
                    <select
                        value={draft.priority}
                        onChange={(e) =>
                            setDraft({...draft, priority: e.target.value as TaskPriority})
                        }
                    >
                        <option value="low">priority：low</option>
                        <option value="medium">priority：medium</option>
                        <option value="high">priority：high</option>
                    </select>
                    <input
                        type="date"
                        value={draft.due_date}
                        onChange={(e) => setDraft({...draft, due_date: e.target.value})}
                    />
                </div>
                <div className="task-form__actions">
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => setIsEditing(false)}
                        disabled={saving}
                    >
                        cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn--accent"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "saving…" : "save"}
                    </button>
                </div>
            </article>
        );
    }

    return (
        <article className={`task-card task-card--${task.priority} ${isPending ? "task-card--pending" : ""}`}>
            <header className="task-card__header">
                <h3>{task.title}</h3>
                <span className={`priority-tag priority-tag--${task.priority}`}>
          {task.priority}
        </span>
            </header>
            {task.description && <p className="task-card__desc">{task.description}</p>}
            <footer className="task-card__footer">
        <span className="task-card__meta">
          {task.due_date ? task.due_date : `#${Math.abs(task.id)}`}
        </span>
                <div className="task-card__actions">
                    {next && (
                        <button
                            className="btn btn--link"
                            onClick={() => onStatusChange(task.id, next)}
                            disabled={isPending}
                        >
                            {NEXT_LABEL[task.status]}
                        </button>
                    )}
                    <button
                        className={"btn btn--link"}
                        onClick={startEditing}
                        disabled={isPending}
                    >
                        edit
                    </button>
                    <button
                        className="btn btn--link btn--danger"
                        onClick={() => onDelete(task.id)}
                        disabled={isPending}
                    >
                        delete
                    </button>
                </div>
            </footer>
        </article>
    );
}
