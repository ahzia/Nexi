"use client";

import { Bot } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";

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
      className={`group relative flex w-full cursor-grab flex-col gap-3 rounded-2xl border px-4 py-3 text-left shadow-md transition ${
        selected
          ? "border-[var(--color-primary-500)] bg-[var(--ui-surface)]"
          : "border-[var(--color-primary-500)]/60 bg-[var(--color-primary-100)]/20 hover:border-[var(--color-primary-500)]"
      }`}
      onDoubleClick={() => onInspect?.(tool.id)}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-[var(--color-primary-500)]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-[var(--color-primary-500)]" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-500)]/15 text-[var(--color-primary-600)]">
          <Bot className="h-4 w-4" />
          </span>
          <div className="flex flex-col">
            <span className="truncate text-sm font-semibold text-[var(--ui-text-primary)]">{tool.name}</span>
            <span className="truncate text-xs text-[var(--ui-text-secondary)]">{tool.path}</span>
          </div>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-[var(--color-primary-500)] opacity-0 transition group-hover:opacity-100"
          onClick={() => onInspect?.(tool.id)}
        >
          Inspect
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: `${badgeColor}22`,
            color: badgeColor,
          }}
        >
          {tool.method.toUpperCase()}
        </span>
        {tool.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-[var(--ui-surface)] px-2 py-0.5 text-[10px] text-[var(--ui-text-secondary)]">
            {tag}
          </span>
        ))}
        {tool.tags.length > 2 ? (
          <span className="text-[10px] text-[var(--ui-text-secondary)]">+{tool.tags.length - 2}</span>
        ) : null}
      </div>
      <p className="line-clamp-2 text-xs text-[var(--ui-text-secondary)]">{tool.description}</p>
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


