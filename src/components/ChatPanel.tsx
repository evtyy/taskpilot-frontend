import { useRef, useState, type FormEvent } from "react";
import { sendChatMessage, toErrorMessage } from "../api/client";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  time: string;
}

interface ChatPanelProps {
  open: boolean;
  onTaskCreated: () => void;
}

const QUICK_ACTIONS = [
  { label: "Summarize", send: "Summarize the board" },
  { label: "High priority", send: "Show high priority tasks" },
  { label: "Add task:", prefill: "Add task: " },
];

let messageId = 0;

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatPanel({ open, onTaskCreated }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: messageId++,
      role: "assistant",
      text: 'Hi! I can help manage this board.\n\nTry:\n• "Add task: Fix login bug [high]"\n• "Move \'Auth token\' to done"\n• "Show high priority tasks"\n• "Summarize the board"',
      time: timestamp(),
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function sendMessage(text: string) {
    if (!text || sending) return;

    setMessages((prev) => [
      ...prev,
      { id: messageId++, role: "user", text, time: timestamp() },
    ]);
    setInput("");
    setSending(true);

    try {
      const res = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: messageId++, role: "assistant", text: res.reply, time: timestamp() },
      ]);
      if (res.task) {
        onTaskCreated(); // triggers a refetch so the new task shows up on the board
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: messageId++, role: "assistant", text: toErrorMessage(err), time: timestamp() },
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

  if (!open) return null;

  return (
    <aside className="chat-sidebar">
      <header className="chat-sidebar__header">
        <div className="chat-avatar">A</div>
        <div>
          <div className="chat-sidebar__title">Board Assistant</div>
          <div className="chat-status">
            <span className="chat-status__dot" />
            Online
          </div>
        </div>
      </header>

      <div className="chat-panel__messages">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble chat-bubble--${m.role}`}>
            <div className="chat-bubble__text">{m.text}</div>
            <div className="chat-bubble__time">{m.time}</div>
          </div>
        ))}
        {sending && (
          <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">
            …
          </div>
        )}
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
          placeholder="Message…"
          disabled={sending}
        />
        <button
          type="submit"
          className="chat-send"
          disabled={sending || !input.trim()}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </aside>
  );
}
