import { useState, type FormEvent } from "react";
import { sendChatMessage, toErrorMessage } from "../api/client";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

interface ChatPanelProps {
  onTaskCreated: () => void;
}

let messageId = 0;

export function ChatPanel({ onTaskCreated }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: messageId++,
      role: "assistant",
      text: 'Tell me what to add — e.g. "add a high priority task to fix the login bug by Friday".',
    },
  ]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: messageId++, role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: messageId++, role: "assistant", text: res.reply },
      ]);
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

  return (
    <>
      <button
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div className="chat-panel">
          <header className="chat-panel__header">
            <span>Task Assistant</span>
          </header>

          <div className="chat-panel__messages">
            {messages.map((m) => (
              <div key={m.id} className={`chat-bubble chat-bubble--${m.role}`}>
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">
                …
              </div>
            )}
          </div>

          <form className="chat-panel__input-row" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a task…"
              disabled={sending}
            />
            <button type="submit" className="btn btn--accent" disabled={sending}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
