import {useEffect, useMemo, useState} from "react";
import {ConnectionStatus} from "./components/ConnectionStatus";
import {FilterBar} from "./components/FilterBar";
import {LoginPage} from "./components/LoginPage";
import {TaskColumn} from "./components/TaskColumn";
import {TaskForm} from "./components/TaskForm";
import {useAuth} from "./hooks/useAuth";
import {useBackendStatus} from "./hooks/useBackendStatus";
import {useTasks} from "./hooks/useTasks";
import {ChatPanel} from "./components/ChatPanel";
import {LogoutIcon, RefreshIcon} from "./components/icons";

import type {TaskPriority, TaskStatus} from "./types/task";
import "./App.css";

const COLUMNS: { status: TaskStatus; label: string }[] = [
    {status: "todo", label: "Todo"},
    {status: "in_progress", label: "In Progress"},
    {status: "done", label: "Done"},
];

function App() {
    const auth = useAuth();
    const {tasks, loading, error, refresh, addTask, editTask, removeTask} =
        useTasks();
    const backendStatus = useBackendStatus();

    const [query, setQuery] = useState("");
    const [priority, setPriority] = useState<TaskPriority | "all">("all");
    const [chatCollapsed, setChatCollapsed] = useState(true);

    const filtered = useMemo(() => {
        return tasks.filter((t) => {
            const matchesQuery = t.title.toLowerCase().includes(query.toLowerCase());
            const matchesPriority = priority === "all" || t.priority === priority;
            return matchesQuery && matchesPriority;
        });
    }, [tasks, query, priority]);

    // Tasks may have failed to load pre-login (401); pull the board in once
    // we have an authenticated user.
    useEffect(() => {
        if (auth.user) refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.user]);

    if (auth.initializing) {
        return <div className="auth-page" />;
    }

    if (!auth.user) {
        return (
            <LoginPage
                submitting={auth.submitting}
                error={auth.error}
                onLogin={auth.login}
                onRegister={auth.register}
                onClearError={auth.clearError}
            />
        );
    }

    return (
        <div className="layout">
            <div className="app">
                <header className="app-header">
                    <div className="app-header__title">
                        <h1>TaskPilot</h1>
                        <span className="app-header__subtitle">React + FastAPI demo</span>
                    </div>
                    <div className="app-header__right">
                        <ConnectionStatus status={backendStatus}/>
                        <button className="btn btn--pill-ghost" onClick={refresh} disabled={loading}>
                            <RefreshIcon className="btn__icon btn__icon--sm"/>
                            {loading ? "Refreshing…" : "Refresh"}
                        </button>
                        <span className="app-header__user">{auth.user.username}</span>
                        <button className="btn btn--icon" onClick={auth.logout} title="Sign out">
                            <LogoutIcon className="btn__icon"/>
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
                            onQuickAdd={(status) =>
                                addTask({title: "Untitled task", status, priority: "medium"})
                            }
                        />
                    ))}
                </main>
            </div>

            <ChatPanel
                collapsed={chatCollapsed}
                onToggleCollapsed={() => setChatCollapsed((c) => !c)}
                onTaskCreated={refresh}
            />
        </div>
    );
}

export default App;
