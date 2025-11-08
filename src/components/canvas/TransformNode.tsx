import type { NodeProps } from "reactflow";

interface TransformNodeData {
  transformer?: string;
  responseType?: string;
}

export function TransformNode({ data }: NodeProps<TransformNodeData>) {
  return (
    <div className="w-60 rounded-2xl border border-[var(--color-primary-500)]/40 bg-[var(--color-primary-500)]/10 p-4 text-left text-xs">
      <p className="text-sm font-semibold text-[var(--color-primary-600)]">Transform response</p>
      <p className="mt-2 text-[var(--ui-text-secondary)]">
        {data.transformer === "xml-to-json"
          ? "Converts XML payloads to JSON for agents."
          : data.transformer
          ? `Transformer: ${data.transformer}`
          : "Pass-through response."}
      </p>
      {data.responseType ? (
        <p className="mt-2 text-[var(--ui-text-secondary)]">Content-Type: {data.responseType}</p>
      ) : null}
    </div>
  );
}
