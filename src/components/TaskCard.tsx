import { useState } from "react";
import type { Task, TaskStatus, TaskUpdate } from "../types/task";
import { Modal } from "./Modal";
import { TaskFields, type TaskDraft } from "./TaskFields";
import { PencilIcon, TrashIcon, ChevronRightIcon } from "./icons";

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
    todo: "Start",
    in_progress: "Mark done",
    done: "",
};

function draftFrom(task: Task): TaskDraft {
    return {
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        due_date: task.due_date ?? "",
    };
}

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
    const next = NEXT_STATUS[task.status];
    const isPending = task.id < 0; // optimistic placeholder

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<TaskDraft>(() => draftFrom(task));

    function startEditing() {
        setDraft(draftFrom(task));
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

    return (
        <article className={`task-card ${isPending ? "task-card--pending" : ""}`}>
            <div className="task-card__header">
                <h3>{task.title}</h3>
                <span className={`priority-tag priority-tag--${task.priority}`}>{task.priority}</span>
            </div>
            {task.description && <p className="task-card__desc">{task.description}</p>}
            <footer className="task-card__footer">
                <span className="task-card__meta">
                    {task.due_date ? task.due_date : `#${Math.abs(task.id)}`}
                </span>
                <span className="task-card__spacer" />
                <div className="task-card__actions">
                    {next && (
                        <button
                            className="btn btn--pill"
                            onClick={() => onStatusChange(task.id, next)}
                            disabled={isPending}
                        >
                            {NEXT_LABEL[task.status]}
                            <ChevronRightIcon className="btn__icon btn__icon--sm" />
                        </button>
                    )}
                    <button
                        className="btn btn--icon"
                        onClick={startEditing}
                        disabled={isPending}
                        aria-label="Edit task"
                        title="Edit"
                    >
                        <PencilIcon className="btn__icon" />
                    </button>
                    <button
                        className="btn btn--icon btn--danger"
                        onClick={() => onDelete(task.id)}
                        disabled={isPending}
                        aria-label="Delete task"
                        title="Delete"
                    >
                        <TrashIcon className="btn__icon" />
                    </button>
                </div>
            </footer>

            {isEditing && (
                <Modal title="Edit task" onClose={() => setIsEditing(false)}>
                    <div className="task-fields-form">
                        <TaskFields draft={draft} onChange={setDraft} autoFocus />
                        <div className="task-fields__actions">
                            <button
                                type="button"
                                className="btn btn--ghost"
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--accent"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Saving…" : "Save"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </article>
    );
}
