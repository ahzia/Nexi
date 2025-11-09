import { Workflow } from "lucide-react";
import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";

interface RequestTransformNodeData {
  contentType?: string;
}

export function RequestTransformNode({ data }: NodeProps<RequestTransformNodeData>) {
  return (
    <div className="relative w-60 rounded-2xl border border-[var(--color-info-500,#0ea5e9)]/60 bg-[var(--color-info-500,#0ea5e9)]/10 p-4 text-left text-xs">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-[#0ea5e9]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-[#0ea5e9]" />
      <div className="flex items-center gap-2 text-[#0a8ac3]">
        <Workflow className="h-4 w-4" />
        <p className="text-sm font-semibold">Prepare request</p>
      </div>
      <p className="mt-2 text-[var(--ui-text-secondary)]">
        Converts JSON arguments into the payload format expected by the upstream API.
      </p>
      {data.contentType ? (
        <p className="mt-2 text-[var(--ui-text-secondary)]">Content-Type: {data.contentType}</p>
      ) : null}
    </div>
  );
}
