/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChatWindowProps {
  slug: string;
  instanceName?: string | null;
  apiKey?: string;
  mode?: "embed" | "full";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
}

type ChatPayloadContent =
  | { type: "text"; text: string }
  | { type: "mcp_tool_result"; tool_use_id: string; content: string; is_error?: boolean };

interface ChatPayloadMessage {
  role: "user" | "assistant";
  content: ChatPayloadContent[];
}

export function ChatWindow({ slug, instanceName, apiKey, mode = "full" }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatPayloadMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const createSession = useCallback(
    async (options?: { appendNotice?: boolean }) => {
      setError(null);
      try {
        const response = await fetch("/api/chat/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug,
            apiKey: apiKey || undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to create chat session.");
        }

        setMessages((prev) => {
          const welcome: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            text: `You're connected to the "${data.displayName ?? slug}" chat agent.`,
          };

          if (options?.appendNotice) {
            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                text: "The previous session expired. Starting a new chat.",
              },
              welcome,
            ];
          }

          if (prev.length === 0) {
            return [welcome];
          }

          return [...prev, welcome];
        });

        setHistory([]);

        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      }
    },
    [slug, apiKey],
  );

  useEffect(() => {
    createSession();
  }, [createSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, options?: { enqueue?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const enqueue = options?.enqueue ?? true;

      const userMessage: ChatMessage | null = enqueue
        ? {
            id: crypto.randomUUID(),
            role: "user",
            text: trimmed,
          }
        : null;

      if (userMessage) {
        setMessages((prev) => [...prev, userMessage]);
      }

      setInput("");
      setLoading(true);
      setError(null);

      const previousHistory = history;

      try {
        const nextHistory: ChatPayloadMessage[] = [
          ...history,
          {
            role: "user",
            content: [{ type: "text", text: trimmed }],
          },
        ];
        setHistory(nextHistory);

        const response = await fetch("/api/chat/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug,
            apiKey: apiKey || undefined,
            history: nextHistory,
            message: trimmed,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to send message.");
        }

        setMessages((prev) => [
          ...prev,
          ...data.toolOutputs.map((tool: { content: string }) => ({
            id: crypto.randomUUID(),
            role: "tool" as const,
            text: tool.content,
          })),
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: data.reply,
          },
        ]);
        setHistory(data.history ?? nextHistory);
      } catch (err) {
        setHistory(previousHistory);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [history, slug, apiKey],
  );

  const handleSend = () => {
    if (!input.trim()) return;
    void sendMessage(input);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex h-full flex-col ${
        mode === "embed" ? "rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)]" : ""
      }`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-[var(--ui-border)] px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--ui-text-primary)]">Chat agent · {instanceName ?? slug}</span>
          <span className="text-xs text-[var(--ui-text-secondary)]">
            Powered by your published MCP connector
          </span>
        </div>
        {mode === "embed" ? (
          <span className="text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">Nexi</span>
        ) : null}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
        {messages.map((message) => (
          <ChatBubble key={message.id} role={message.role} text={message.text} />
        ))}
        {error ? (
          <div className="rounded-2xl border border-[var(--color-error-500)]/60 bg-[var(--color-error-500)]/10 p-3 text-sm text-[var(--color-error-200)]">
            {error}
          </div>
        ) : null}
      </div>

      <div className="border-t border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 px-4 py-4">
        <div className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message…"
            className="min-h-[80px] rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-sm text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)]"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-primary-500)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-600)] disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ role, text }: { role: ChatMessage["role"]; text: string }) {
  const baseClass =
    "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 shadow";

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className={`${baseClass} bg-[var(--color-primary-500)] text-white`}>{text}</div>
      </div>
    );
  }

  if (role === "tool") {
    return (
      <div className="flex justify-start">
        <div className={`${baseClass} border border-[var(--color-info-500,#0ea5e9)]/50 bg-[var(--color-info-500,#0ea5e9)]/10 text-[var(--ui-text-secondary)]`}>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-info-500,#0ea5e9)]">Tool output</p>
          <div className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className={`${baseClass} border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text-primary)]`}>
        {text}
      </div>
    </div>
  );
}

function markdownToHtml(text: string) {
  if (!text.includes("```")) {
    return text.replace(/\n/g, "<br />");
  }
  return text
    .split("```")
    .map((segment, index) =>
      index % 2 === 1
        ? `<pre class="rounded-xl bg-[var(--ui-surface-muted)]/40 p-3 text-xs text-[var(--ui-text-secondary)] whitespace-pre-wrap">${segment}</pre>`
        : segment.replace(/\n/g, "<br />"),
    )
    .join("");
}

