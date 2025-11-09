import { Cpu, MessageSquare, Reply, Server } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";

interface PhaseNodeData {
  title: string;
  subtitle?: string;
  kind: "agent-request" | "runtime" | "client" | "agent-response";
}

export function PhaseNode({ data }: NodeProps<PhaseNodeData>) {
  const { borderClass, icon } = getVisuals(data.kind);

  return (
    <div className={`relative w-56 rounded-2xl border bg-[var(--ui-surface)] p-4 text-left shadow-sm ${borderClass}`}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-[var(--ui-border-strong)]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-[var(--ui-border-strong)]" />
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ui-surface-muted)]/70 text-[var(--ui-text-secondary)]">
          {icon}
        </span>
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-[var(--ui-text-primary)]">{data.title}</p>
          {data.subtitle ? <p className="text-xs text-[var(--ui-text-secondary)]">{data.subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}

function getVisuals(kind: PhaseNodeData["kind"]) {
  switch (kind) {
    case "agent-request":
      return {
        borderClass: "border-[var(--color-primary-500)]/70",
        icon: <MessageSquare className="h-4 w-4" />,
      };
    case "runtime":
      return {
        borderClass: "border-[var(--color-warning-500)]/70",
        icon: <Cpu className="h-4 w-4" />,
      };
    case "client":
      return {
        borderClass: "border-[var(--color-success-500)]/70",
        icon: <Server className="h-4 w-4" />,
      };
    case "agent-response":
    default:
      return {
        borderClass: "border-[var(--color-primary-500)]/40",
        icon: <Reply className="h-4 w-4" />,
      };
  }
}
