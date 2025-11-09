import type { NodeProps } from "reactflow";

interface RequestTransformNodeData {
  contentType?: string;
}

export function RequestTransformNode({ data }: NodeProps<RequestTransformNodeData>) {
  return (
    <div className="w-60 rounded-2xl border border-[var(--color-primary-400)]/40 bg-[var(--color-primary-400)]/10 p-4 text-left text-xs">
      <p className="text-sm font-semibold text-[var(--color-primary-500)]">Prepare request</p>
      <p className="mt-2 text-[var(--ui-text-secondary)]">
        Converts JSON arguments into the payload format expected by the upstream API.
      </p>
      {data.contentType ? (
        <p className="mt-2 text-[var(--ui-text-secondary)]">Content-Type: {data.contentType}</p>
      ) : null}
    </div>
  );
}
