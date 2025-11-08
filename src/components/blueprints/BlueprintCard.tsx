"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface ToolSummary {
  id: string;
  name: string;
  method: string;
  path: string;
}

export interface BlueprintCardProps {
  blueprint: {
    id: string;
    label: string;
    created_at: string;
    tools: ToolSummary[];
  };
}

export function BlueprintCard({ blueprint }: BlueprintCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Delete "${blueprint.label}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/tool-blueprints/${blueprint.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Failed to delete blueprint.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/30 p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            href={`/blueprints/${blueprint.id}`}
            className="text-sm font-semibold text-[var(--ui-text-primary)] hover:text-[var(--color-primary-500)]"
          >
            {blueprint.label}
          </Link>
          <p className="text-xs text-[var(--ui-text-secondary)]">{formatDate(blueprint.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1 text-xs text-[var(--ui-text-secondary)]">
            {blueprint.tools.length} tools
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-1 rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-400 hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </header>
      <div className="flex flex-col gap-2 text-xs text-[var(--ui-text-secondary)]">
        {blueprint.tools.slice(0, 3).map((tool) => (
          <div key={tool.id} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
            <p className="font-semibold text-[var(--ui-text-primary)]">{tool.name}</p>
            <p className="uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
              {tool.method.toUpperCase()} · {tool.path}
            </p>
          </div>
        ))}
        {blueprint.tools.length > 3 ? (
          <p className="text-[var(--ui-text-secondary)]">+ {blueprint.tools.length - 3} more…</p>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
