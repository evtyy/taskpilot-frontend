import {useMemo, useState} from "react";
import {ConnectionStatus} from "./components/ConnectionStatus";
import {FilterBar} from "./components/FilterBar";
import {TaskColumn} from "./components/TaskColumn";
import {TaskForm} from "./components/TaskForm";
import {useBackendStatus} from "./hooks/useBackendStatus";
import {useTasks} from "./hooks/useTasks";
import {ChatPanel} from "./components/ChatPanel";

import type {TaskPriority, TaskStatus} from "./types/task";
import "./App.css";

const COLUMNS: { status: TaskStatus; label: string }[] = [
    {status: "todo", label: "TODO"},
    {status: "in_progress", label: "IN PROGRESS"},
    {status: "done", label: "DONE"},
];

function App() {
    const {tasks, loading, error, refresh, addTask, editTask, removeTask} =
        useTasks();
    const backendStatus = useBackendStatus();

    const [query, setQuery] = useState("");
    const [priority, setPriority] = useState<TaskPriority | "all">("all");
    const [chatOpen, setChatOpen] = useState(false);

    const filtered = useMemo(() => {
        return tasks.filter((t) => {
            const matchesQuery = t.title.toLowerCase().includes(query.toLowerCase());
            const matchesPriority = priority === "all" || t.priority === priority;
            return matchesQuery && matchesPriority;
        });
    }, [tasks, query, priority]);

    return (
        <div className="layout">
            <div className="app">
                <header className="app-header">
                    <div className="app-header__title">
                        <h1>Task Board</h1>
                        <span className="app-header__subtitle">React + FastAPI demo</span>
                    </div>
                    <div className="app-header__right">
                        <ConnectionStatus status={backendStatus}/>
                        <button className="btn btn--ghost" onClick={refresh} disabled={loading}>
                            {loading ? "refreshing…" : "refresh"}
                        </button>
                        <button
                            className={`btn ${chatOpen ? "btn--accent" : "btn--ghost"}`}
                            onClick={() => setChatOpen((o) => !o)}
                        >
                            ✨ TaskPilot
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="banner banner--error">
                        {error}
                        <button className="btn btn--link" onClick={refresh}>
                            retry
                        </button>
                    </div>
                )}

                <div className="toolbar">
                    <FilterBar
                        query={query}
                        onQueryChange={setQuery}
                        priority={priority}
                        onPriorityChange={setPriority}
                    />
                    <TaskForm onSubmit={addTask}/>
                </div>

                <main className="board">
                    {COLUMNS.map((col) => (
                        <TaskColumn
                            key={col.status}
                            status={col.status}
                            label={col.label}
                            tasks={filtered.filter((t) => t.status === col.status)}
                            onStatusChange={(id, status) => editTask(id, {status})}
                            onEdit={editTask}
                            onDelete={removeTask}
                        />
                    ))}
                </main>
            </div>

            <ChatPanel open={chatOpen} onTaskCreated={refresh} />
        </div>
    );
}

export default App;
