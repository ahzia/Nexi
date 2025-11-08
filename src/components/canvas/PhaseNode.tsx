import type { NodeProps } from "reactflow";

interface PhaseNodeData {
  title: string;
  subtitle?: string;
}

export function PhaseNode({ data }: NodeProps<PhaseNodeData>) {
  return (
    <div className="w-56 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 text-left shadow-sm">
      <p className="text-sm font-semibold text-[var(--ui-text-primary)]">{data.title}</p>
      {data.subtitle ? <p className="mt-1 text-xs text-[var(--ui-text-secondary)]">{data.subtitle}</p> : null}
    </div>
  );
}
