export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  created_at?: string;
}

// Shape sent to the backend when creating a task.
// `id` / `created_at` are assigned server-side.
export type TaskCreate = Omit<Task, "id" | "created_at">;

// Partial update payload for PATCH/PUT requests.
export type TaskUpdate = Partial<TaskCreate>;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
