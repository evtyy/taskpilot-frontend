import axios from "axios";
import type { Task, TaskCreate, TaskUpdate } from "../types/task";
import type { AuthCredentials, AuthResponse, User } from "../types/auth";

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

// --- Auth token plumbing -------------------------------------------------
// Token lives in localStorage so it survives a page refresh. The request
// interceptor attaches it to every call; the response interceptor clears it
// and broadcasts an event (picked up by useAuth) when the backend says it's
// no longer valid, e.g. it expired.
const TOKEN_STORAGE_KEY = "taskpilot_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      setStoredToken(null);
      window.dispatchEvent(new Event("taskpilot:unauthorized"));
    }
    return Promise.reject(err);
  }
);

// --- Auth -----------------------------------------------------------
export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", credentials);
  return data;
}

export async function register(credentials: AuthCredentials): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", credentials);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}

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

// --- Chat -----------------------------------------------------------
// sends a message to the backend, which hits groq (function calling) to
// either create a task or just reply back
export interface ChatResponse {
  reply: string;
  task: Task | null;
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>("/chat", { message });
  return data;
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
