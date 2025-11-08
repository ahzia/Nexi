import type { NodeProps } from "reactflow";

interface ValidationNodeData {
  requiredParams: Array<{ name: string; in: string }>;
  requiresBody: boolean;
}

export function ValidationNode({ data }: NodeProps<ValidationNodeData>) {
  return (
    <div className="w-60 rounded-2xl border border-[var(--color-primary-500)]/40 bg-[var(--color-primary-500)]/10 p-4 text-left text-xs">
      <p className="text-sm font-semibold text-[var(--color-primary-600)]">Validate request</p>
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
