"use client";

import type { NodeProps } from "reactflow";

import type { ToolDraft } from "@/lib/types/tooling";

type CanvasTool = Omit<ToolDraft, "rawOperation">;

interface ToolNodeData {
  tool: CanvasTool;
  selected?: boolean;
  onInspect?: (toolId: string) => void;
}

export function ToolNode({ data }: NodeProps<ToolNodeData>) {
  const { tool, selected, onInspect } = data;
  const badgeColor = getMethodColor(tool.method);

  return (
    <div
      className={`flex w-full flex-col gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
        selected
          ? "border-[var(--color-primary-500)] bg-[var(--ui-surface)]"
          : "border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: `${badgeColor}22`,
            color: badgeColor,
          }}
        >
          {tool.method.toUpperCase()}
        </span>
        <button
          type="button"
          className="text-xs font-medium text-[var(--color-primary-500)] transition hover:text-[var(--color-primary-600)]"
          onClick={() => onInspect?.(tool.id)}
        >
          Inspect
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <span className="truncate text-sm font-semibold text-[var(--ui-text-primary)]">{tool.name}</span>
        <span className="truncate text-xs text-[var(--ui-text-secondary)]">{tool.path}</span>
      </div>
      <p className="line-clamp-2 text-xs text-[var(--ui-text-secondary)]">{tool.description}</p>
      {tool.tags.length ? (
        <div className="flex flex-wrap gap-1">
          {tool.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-0.5 text-[10px] text-[var(--ui-text-secondary)]"
            >
              {tag}
            </span>
          ))}
          {tool.tags.length > 3 ? (
            <span className="text-[10px] text-[var(--ui-text-secondary)]">+{tool.tags.length - 3}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getMethodColor(method: CanvasTool["method"]) {
  switch (method.toLowerCase()) {
    case "get":
      return "#10b981";
    case "post":
      return "#3b82f6";
    case "put":
      return "#f59e0b";
    case "patch":
      return "#a855f7";
    case "delete":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}


