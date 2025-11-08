"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/ui/modal";

export function GenerateBlueprintLauncher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus("Analyzing input...");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/blueprints/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: input }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to generate blueprint");
      }

      const payload = await response.json();
      setStatus("Blueprint created. Redirecting...");
      setIsSubmitting(false);
      setOpen(false);
      setInput("");
      router.push(`/blueprints/${payload.id}`);
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      setStatus(null);
      setError((err as Error).message);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-3 rounded-2xl bg-[var(--ui-button-primary)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-md)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)]"
      >
        Generate MCP Blueprint
      </button>

      <Modal
        open={open}
        onClose={() => {
          if (!isSubmitting) {
            setOpen(false);
            setStatus(null);
            setError(null);
          }
        }}
        title="Create MCP Blueprint"
        description="Paste OpenAPI JSON/YAML or free-form documentation. We'll convert it into a workable MCP tool set."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste API docs, OpenAPI schema, or describe the endpoints you need..."
            className="min-h-[260px] w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-4 font-mono text-sm leading-6 text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
            spellCheck={false}
          />
          {status ? <p className="text-sm text-[var(--color-primary-500)]">{status}</p> : null}
          {error ? <p className="text-sm text-[var(--color-error-500)]">{error}</p> : null}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (!isSubmitting) {
                  setOpen(false);
                  setStatus(null);
                  setError(null);
                }
              }}
              className="rounded-xl border border-[var(--ui-border)] px-4 py-2 text-sm text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !input.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ui-button-primary)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
