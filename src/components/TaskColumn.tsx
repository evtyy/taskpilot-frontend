import type { Task, TaskStatus, TaskUpdate } from "../types/task";
import { TaskCard } from "./TaskCard";
import { PlusIcon } from "./icons";

interface TaskColumnProps {
    status: TaskStatus;
    label: string;
    tasks: Task[];
    onStatusChange: (id: number, status: TaskStatus) => void;
    onEdit: (id: number, payload: TaskUpdate) => Promise<void>;
    onDelete: (id: number) => void;
    onQuickAdd: (status: TaskStatus) => void;
}

export function TaskColumn({
    status,
    label,
    tasks,
    onStatusChange,
    onEdit,
    onDelete,
    onQuickAdd,
}: TaskColumnProps) {
    return (
        <section className="task-column">
            <header className="task-column__header">
                <span className={`task-column__dot task-column__dot--${status}`} />
                <span className="task-column__label">{label}</span>
                <span className="task-column__count">{tasks.length}</span>
                <button
                    className="task-column__add"
                    onClick={() => onQuickAdd(status)}
                    aria-label={`Quick add task to ${label}`}
                    title="Quick add"
                >
                    <PlusIcon className="btn__icon" />
                </button>
            </header>
            <div className="task-column__body">
                {tasks.length === 0 && <p className="task-column__empty">No tasks yet</p>}
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={onStatusChange}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </section>
    );
}
