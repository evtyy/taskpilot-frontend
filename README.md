# Task Board

A full-stack task management (Kanban-style) app built to practice frontend↔backend integration. React/TypeScript frontend talking to a FastAPI backend over a REST API, with async MySQL persistence via SQLAlchemy. Deployed as three containers (frontend, backend, database) with Docker Compose.

## Stack

**Frontend:** React 19 · TypeScript · Vite · Axios · Docker (multi-stage build) · Nginx
**Backend:** FastAPI · SQLAlchemy 2.0 (async) · MySQL 8 · aiomysql · Pydantic v2

## Features

- Full task CRUD: create, edit, delete, change status (todo → in_progress → done)
- Inline editing of title, description, priority, and due date directly on each card
- Optimistic UI updates on the frontend, with automatic rollback if a request fails
- Kanban board with three columns, search by title, filter by priority
- Live backend connection indicator (polls `GET /health`)
- Auto-seeded sample data on first run so the board isn't empty
- Chatbot (bottom-right floating button): describe a task in plain English and it gets created via LLM function calling (Groq, Llama 3.3 70B)

## Project Structure

```
taskboard/
├── docker-compose.yml         # orchestrates all three services
├── task-board/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/client.ts           # Axios instance + all backend calls
│   │   ├── types/task.ts            # Task type definitions
│   │   ├── hooks/                    # useTasks, useBackendStatus
│   │   └── components/                # UI components (incl. ChatPanel.tsx)
│   ├── Dockerfile
│   └── .env.example
│
└── task-board-api/             # Backend (FastAPI)
    ├── main.py                    # models, schemas, routes, lifespan/seed logic
    ├── requirements.txt
    └── Dockerfile
```

## Running Everything with Docker Compose (recommended)

This spins up MySQL, the backend, and the frontend together, wired to talk to each other.

The chatbot needs a Groq API key (free tier at [console.groq.com](https://console.groq.com)). Create a `.env` file next to `docker-compose.yml`:
```bash
echo "GROQ_API_KEY=gsk_..." > .env
```
Docker Compose loads this automatically and passes it into the backend container (`docker-compose.yml`'s `backend.environment`). Without it, everything else works fine but `/chat` returns a 500.

```bash
cd taskboard
docker compose up --build
```

- Frontend: `http://localhost:3001`
- Backend docs (Swagger): `http://localhost:8000/docs`
- MySQL (e.g. for connecting with PyCharm/TablePlus): `localhost:3307`, user `root`, password `123456`

To stop and clean up:
```bash
docker compose down
```

### How the services find each other

Inside the Docker network, containers address each other **by service name**, not `localhost`:

- The backend connects to MySQL at `db:3306` (not `localhost:3306`) — set via the `DATABASE_URL` environment variable in `docker-compose.yml`
- The frontend's browser-executed JS, however, runs **outside** Docker on your machine, so it must call the backend at `http://localhost:8000`, not `http://backend:8000` — service names are only resolvable from inside the Docker network, and the browser doesn't live there

## Running Locally Without Docker

### Backend

```bash
cd task-board-api
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create the database once:
```sql
CREATE DATABASE task_board CHARACTER SET utf8mb4;
```

`main.py` reads `DATABASE_URL` from the environment and falls back to a local default if unset:
```python
ASYNC_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "mysql+aiomysql://root:123456@localhost:3306/task_board?charset=utf8",
)
```
Adjust the fallback to match your local MySQL credentials.

The chatbot also reads `GROQ_API_KEY` from the environment (free tier at [console.groq.com](https://console.groq.com)):
```bash
export GROQ_API_KEY=gsk_...
```
Everything else works without it — you'll just get a 500 from `/chat`.

Then run:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd task-board
npm install
cp .env.example .env      # adjust VITE_API_URL if your backend runs elsewhere
npm run dev
```
Runs at `http://localhost:5173`.

**Important:** `VITE_API_URL` is baked into the build at build/start time, not read live — after changing `.env`, fully restart `npm run dev` (stop and rerun, not just save the file).

## API Contract

```
GET    /health          → 200 { "status": "ok" }
GET    /tasks             → Task[]
POST   /tasks             → Task            body: TaskCreate
PUT    /tasks/{id}        → Task            body: TaskUpdate (all fields optional)
DELETE /tasks/{id}        → 204
POST   /chat               → ChatResponse   body: { message: string }
```

```ts
interface Task {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date?: string | null;
  create_time: string;
}

interface ChatResponse {
  reply: string;
  task?: Task;   // present only if the message resulted in a created task
}
```

`/chat` sends the message to Groq (Llama 3.3 70B) with a `create_task` function tool. The model only decides whether/how to call it — the backend is what actually writes to the database, so the LLM never touches persistence directly. Requires `GROQ_API_KEY` to be set on the backend; returns 500 if it's missing.

## CORS

```python
allow_origins=[
    "http://localhost:5173",  # npm run dev
    "http://localhost:3001",  # docker compose up
]
```
Add any other origin here before deploying elsewhere. Avoid `allow_origins=["*"]`.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Frontend shows "backend unreachable" but `localhost:8000/health` works fine in the browser | `VITE_API_URL` was set to `http://backend:8000` — that hostname only resolves inside the Docker network. Use `http://localhost:8000` for anything the browser calls directly, then rebuild the frontend |
| `port is already allocated` / `address already in use` | Something else (often a local MySQL install for port 3306, or a leftover container for 3001) is already using that port. Find it with `lsof -i :<port>`, then stop it or remap the port in `docker-compose.yml` |
| Chat button does nothing / `/chat` returns 500 `"GROQ_API_KEY is not set on the server"` | The backend container/process doesn't have `GROQ_API_KEY` in its environment. For Docker Compose, check it's in the root `.env` file (not just exported in your shell — Compose only auto-loads a `.env` file) and that `docker-compose.yml`'s `backend.environment` references it |
| Backend container stuck `Restarting` in `docker compose ps` | Check `docker compose logs backend` for the actual error — common causes: missing `cryptography` package (needed for MySQL 8's default auth), or a bad `DATABASE_URL` |
| `RuntimeError: 'cryptography' package is required...` | Add `cryptography` to `requirements.txt` and rebuild |
| `ResponseValidationError` on `/tasks` | A field in the SQLAlchemy model doesn't match the Pydantic response model's fields, or the MySQL table's columns are out of date after a model change — drop the table and let `create_all` rebuild it |
| Board loads but no tasks appear, no errors in the console | The response model is likely missing fields (e.g. `status`) that the frontend needs to sort tasks into columns — check that `Task` includes all fields the frontend expects |
| `no configuration file provided: not found` | You're not in the directory containing `docker-compose.yml`, or it hasn't been moved to the project root yet |

