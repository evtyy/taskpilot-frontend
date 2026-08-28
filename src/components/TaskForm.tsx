import { useState, type FormEvent } from "react";
import type { TaskCreate, TaskStatus } from "../types/task";
import { Modal } from "./Modal";
import { TaskFields, type TaskDraft } from "./TaskFields";
import { PlusIcon } from "./icons";

interface TaskFormProps {
    onSubmit: (payload: TaskCreate) => Promise<void>;
    defaultStatus?: TaskStatus;
}

const EMPTY: TaskDraft = { title: "", description: "", priority: "medium", due_date: "" };

export function TaskForm({ onSubmit, defaultStatus = "todo" }: TaskFormProps) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<TaskDraft>(EMPTY);
    const [submitting, setSubmitting] = useState(false);

    function close() {
        setOpen(false);
        setDraft(EMPTY);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!draft.title.trim()) return;
        setSubmitting(true);
        try {
            await onSubmit({
                title: draft.title.trim(),
                description: draft.description.trim() || undefined,
                status: defaultStatus,
                priority: draft.priority,
                due_date: draft.due_date || undefined,
            });
            close();
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <button className="btn btn--accent add-task-trigger" onClick={() => setOpen(true)}>
                <PlusIcon className="btn__icon" />
                Add task
            </button>

            {open && (
                <Modal title="Add task" onClose={close}>
                    <form className="task-fields-form" onSubmit={handleSubmit}>
                        <TaskFields draft={draft} onChange={setDraft} autoFocus />
                        <div className="task-fields__actions">
                            <button type="button" className="btn btn--ghost" onClick={close} disabled={submitting}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn--accent" disabled={submitting}>
                                {submitting ? "Adding…" : "Add task"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
