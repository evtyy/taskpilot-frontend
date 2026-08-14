import { useCallback, useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  toErrorMessage,
  updateTask,
} from "../api/client";
import type { Task, TaskCreate, TaskUpdate } from "../types/task";

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTask: (payload: TaskCreate) => Promise<void>;
  editTask: (id: number, payload: TaskUpdate) => Promise<void>;
  removeTask: (id: number) => Promise<void>;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTask = useCallback(async (payload: TaskCreate) => {
    setError(null);
    // Optimistic placeholder so the UI feels instant while the request
    // is in flight; replaced with the server response on success.
    const tempId = -Date.now();
    const optimistic: Task = { id: tempId, ...payload };
    setTasks((prev) => [optimistic, ...prev]);
    try {
      const created = await createTask(payload);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      setError(toErrorMessage(err));
      throw err;
    }
  }, []);

  const editTask = useCallback(async (id: number, payload: TaskUpdate) => {
    setError(null);
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...payload } : t))
    );
    try {
      const updated = await updateTask(id, payload);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setTasks(previous);
      setError(toErrorMessage(err));
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const removeTask = useCallback(async (id: number) => {
    setError(null);
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTask(id);
    } catch (err) {
      setTasks(previous);
      setError(toErrorMessage(err));
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  return { tasks, loading, error, refresh, addTask, editTask, removeTask };
}
