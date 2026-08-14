import { useState, type FormEvent } from "react";
import type { TaskCreate, TaskPriority } from "../types/task";

interface TaskFormProps {
  onSubmit: (payload: TaskCreate) => Promise<void>;
}

const EMPTY = { title: "", description: "", priority: "medium" as TaskPriority, due_date: "" };

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: "todo",
        priority: form.priority,
        due_date: form.due_date || undefined,
      });
      setForm(EMPTY);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn--ghost add-task-trigger" onClick={() => setOpen(true)}>
        <span className="add-task-trigger__plus">+</span> add task
      </button>
    );
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        className="task-form__title"
        placeholder="task title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        maxLength={120}
      />
      <textarea
        className="task-form__desc"
        placeholder="description（optional）"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
      />
      <div className="task-form__row">
        <select
          value={form.priority}
          onChange={(e) =>
            setForm({ ...form, priority: e.target.value as TaskPriority })
          }
        >
          <option value="low">priority：low</option>
          <option value="medium">priority：medium</option>
          <option value="high">priority：high</option>
        </select>
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
        />
      </div>
      <div className="task-form__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setOpen(false);
            setForm(EMPTY);
          }}
        >
          cancel
        </button>
        <button type="submit" className="btn btn--accent" disabled={submitting}>
          {submitting ? "adding…" : "add task"}
        </button>
      </div>
    </form>
  );
}
