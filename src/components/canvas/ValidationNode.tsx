import { ShieldCheck } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";

interface ValidationNodeData {
  requiredParams: Array<{ name: string; in: string }>;
  requiresBody: boolean;
}

export function ValidationNode({ data }: NodeProps<ValidationNodeData>) {
  return (
    <div className="relative w-60 rounded-2xl border border-[var(--color-warning-500)]/60 bg-[var(--color-warning-500)]/10 p-4 text-left text-xs">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-[var(--color-warning-500)]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-[var(--color-warning-500)]" />
      <div className="flex items-center gap-2 text-[var(--color-warning-600)]">
        <ShieldCheck className="h-4 w-4" />
        <p className="text-sm font-semibold">Validate request</p>
      </div>
      {data.requiredParams.length ? (
        <div className="mt-2">
          <p className="font-medium text-[var(--ui-text-secondary)]">Required parameters</p>
          <ul className="mt-1 space-y-1 text-[var(--ui-text-secondary)]">
            {data.requiredParams.map((param) => (
              <li key={`${param.in}-${param.name}`}>{param.name} <span className="uppercase text-[0.65rem] text-[var(--color-primary-500)]">{param.in}</span></li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-[var(--ui-text-secondary)]">Ready to call without extra parameters.</p>
      )}
      {data.requiresBody ? (
        <p className="mt-2 text-[var(--ui-text-secondary)]">Ensures XML payload is provided.</p>
      ) : null}
    </div>
  );
}
