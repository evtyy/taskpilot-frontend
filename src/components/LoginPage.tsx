import { useState, type FormEvent } from "react";
import type { AuthCredentials } from "../types/auth";

interface LoginPageProps {
    submitting: boolean;
    error: string | null;
    onLogin: (credentials: AuthCredentials) => Promise<void>;
    onRegister: (credentials: AuthCredentials) => Promise<void>;
    onClearError: () => void;
}

export function LoginPage({ submitting, error, onLogin, onRegister, onClearError }: LoginPageProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    function switchMode(next: "login" | "register") {
        setMode(next);
        onClearError();
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const credentials: AuthCredentials = { username: username.trim(), password };
        try {
            if (mode === "login") await onLogin(credentials);
            else await onRegister(credentials);
        } catch {
            // error is surfaced via the `error` prop
        }
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <div className="auth-card__brand">
                    <h1>TaskPilot</h1>
                    <span className="app-header__subtitle">
                        {mode === "login" ? "Sign in to your board" : "Create an account"}
                    </span>
                </div>

                {error && <div className="banner banner--error auth-card__error">{error}</div>}

                <label className="auth-field">
                    <span className="auth-field__label">Username</span>
                    <input
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        minLength={3}
                        required
                    />
                </label>

                <label className="auth-field">
                    <span className="auth-field__label">Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        minLength={8}
                        required
                    />
                </label>

                <button type="submit" className="btn btn--accent auth-card__submit" disabled={submitting}>
                    {submitting
                        ? mode === "login"
                            ? "Signing in…"
                            : "Creating account…"
                        : mode === "login"
                            ? "Sign in"
                            : "Create account"}
                </button>

                <div className="auth-card__switch">
                    {mode === "login" ? (
                        <>
                            No account?{" "}
                            <button type="button" className="btn btn--link" onClick={() => switchMode("register")}>
                                Create one
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button type="button" className="btn btn--link" onClick={() => switchMode("login")}>
                                Sign in
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}
