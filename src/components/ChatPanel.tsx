import { useRef, useState, type FormEvent } from "react";
import { sendChatMessage, toErrorMessage } from "../api/client";
import { ArrowUpIcon, ChevronRightIcon, SparkleIcon } from "./icons";

interface ChatMessage {
    id: number;
    role: "user" | "assistant";
    text: string;
}

interface ChatPanelProps {
    collapsed: boolean;
    onToggleCollapsed: () => void;
    onTaskCreated: () => void;
}

const QUICK_ACTIONS = [
    { label: "Summarize", send: "Summarize the board" },
    { label: "High priority", send: "Show high priority tasks" },
    { label: "Add task:", prefill: "Add task: " },
];

let messageId = 0;

export function ChatPanel({ collapsed, onToggleCollapsed, onTaskCreated }: ChatPanelProps) {
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: messageId++,
            role: "assistant",
            text: 'Hi — I can create tasks, set priorities, and move things across columns.\n\nTry:\n• "Add task: Fix login bug [high]"\n• "Move \'Auth token\' to done"\n• "Show high priority tasks"\n• "Summarize the board"',
        },
    ]);
    const inputRef = useRef<HTMLInputElement>(null);

    async function sendMessage(text: string) {
        if (!text || sending) return;

        setMessages((prev) => [...prev, { id: messageId++, role: "user", text }]);
        setInput("");
        setSending(true);

        try {
            const res = await sendChatMessage(text);
            setMessages((prev) => [...prev, { id: messageId++, role: "assistant", text: res.reply }]);
            if (res.task) {
                onTaskCreated(); // triggers a refetch so the new task shows up on the board
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { id: messageId++, role: "assistant", text: toErrorMessage(err) },
            ]);
        } finally {
            setSending(false);
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        sendMessage(input.trim());
    }

    function handleQuickAction(action: (typeof QUICK_ACTIONS)[number]) {
        if (action.prefill) {
            setInput(action.prefill);
            inputRef.current?.focus();
        } else if (action.send) {
            sendMessage(action.send);
        }
    }

    if (collapsed) {
        return (
            <button className="assistant-fab" onClick={onToggleCollapsed}>
                <SparkleIcon className="assistant-fab__icon" />
                Assistant
            </button>
        );
    }

    return (
        <aside className="chat-sidebar">
            <header className="chat-sidebar__header">
                <span className="chat-avatar">
                    <SparkleIcon className="chat-avatar__icon" />
                </span>
                <div className="chat-sidebar__titles">
                    <div className="chat-sidebar__title">TaskPilot Assistant</div>
                    <div className="chat-sidebar__subtitle">Creates and moves tasks for you</div>
                </div>
                <button
                    className="btn btn--icon chat-collapse"
                    onClick={onToggleCollapsed}
                    aria-label="Collapse assistant"
                    title="Collapse"
                >
                    <ChevronRightIcon className="btn__icon" />
                </button>
            </header>

            <div className="chat-panel__messages">
                {messages.map((m) => (
                    <div key={m.id} className={`chat-bubble chat-bubble--${m.role}`}>
                        {m.text}
                    </div>
                ))}
                {sending && <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">…</div>}
            </div>

            <div className="chat-quick-actions">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        className="chat-chip"
                        onClick={() => handleQuickAction(action)}
                        disabled={sending}
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            <form className="chat-panel__input-row" onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask TaskPilot…"
                    disabled={sending}
                />
                <button
                    type="submit"
                    className="chat-send"
                    disabled={sending || !input.trim()}
                    aria-label="Send message"
                >
                    <ArrowUpIcon className="btn__icon" />
                </button>
            </form>
        </aside>
    );
}
