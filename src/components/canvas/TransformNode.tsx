import { GitCompare } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";

interface TransformNodeData {
  transformer?: string;
  responseType?: string;
}

export function TransformNode({ data }: NodeProps<TransformNodeData>) {
  return (
    <div className="relative w-60 rounded-2xl border border-[var(--color-purple-500,#7c3aed)]/60 bg-[var(--color-purple-500,#7c3aed)]/10 p-4 text-left text-xs">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-[#7c3aed]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-[#7c3aed]" />
      <div className="flex items-center gap-2 text-[#6333c6]">
        <GitCompare className="h-4 w-4" />
        <p className="text-sm font-semibold">Transform response</p>
      </div>
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
