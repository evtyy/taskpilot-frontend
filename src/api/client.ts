import axios from "axios";
import type { Task, TaskCreate, TaskUpdate } from "../types/task";

// Base URL is injected at build/runtime via Vite env var, so the same
// image can point at different backends (local, staging, docker network)
// without a rebuild. See .env.example and docker-compose.yml.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Health check -----------------------------------------------------
// Used by the connection indicator in the header. Expects the FastAPI
// backend to expose GET /health returning 200 (e.g. {"status": "ok"}).
export async function checkHealth(): Promise<boolean> {
  try {
    await apiClient.get("/health", { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

// --- Task CRUD ----------------------------------------------------------
// Assumed REST contract on the FastAPI side:
//   GET    /tasks           -> Task[]
//   POST   /tasks           -> Task
//   PUT    /tasks/{id}      -> Task
//   DELETE /tasks/{id}      -> 204
// Adjust the paths below if your backend's routes differ.

export async function fetchTasks(): Promise<Task[]> {
  const { data } = await apiClient.get<Task[]>("/tasks");
  return data;
}

export async function createTask(payload: TaskCreate): Promise<Task> {
  const { data } = await apiClient.post<Task>("/tasks", payload);
  return data;
}

export async function updateTask(
  id: number,
  payload: TaskUpdate
): Promise<Task> {
  const { data } = await apiClient.put<Task>(`/tasks/${id}`, payload);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

// Normalizes axios/network errors into a readable message for the UI.
export function toErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const detail = err.response.data?.detail;
      return typeof detail === "string"
        ? detail
        : `Request failed (${err.response.status})`;
    }
    if (err.code === "ECONNABORTED") return "请求超时，请检查后端是否运行";
    return "Unable to connect to backend，confirm FastAPI server is running";
  }
  return "Unknown error";
}
