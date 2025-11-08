"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node, type NodeTypes } from "reactflow";
import "reactflow/dist/style.css";

import type { ToolDraft } from "@/lib/types/tooling";
import { ToolNode } from "@/components/canvas/ToolNode";

type CanvasTool = Omit<ToolDraft, "rawOperation">;

interface BlueprintCanvasProps {
  tools: CanvasTool[];
  selectedToolId?: string | null;
  onSelectTool?: (toolId: string | null) => void;
}

const nodeTypes: NodeTypes = {
  toolNode: ToolNode,
};

function buildNodes(
  tools: CanvasTool[],
  selectedToolId: string | null | undefined,
  onSelectTool?: (toolId: string) => void,
): Node[] {
  return tools.map((tool, index) => ({
    id: tool.id,
    type: "toolNode",
    position: { x: 240 * (index % 3), y: 180 * Math.floor(index / 3) },
    data: {
      tool,
      selected: tool.id === selectedToolId,
      onInspect: onSelectTool,
    },
  }));
}

function buildEdges(tools: CanvasTool[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < tools.length - 1; i += 1) {
    edges.push({
      id: `${tools[i].id}-${tools[i + 1].id}`,
      source: tools[i].id,
      target: tools[i + 1].id,
      type: "smoothstep",
      animated: true,
      style: { stroke: "var(--color-primary-500)" },
    });
  }
  return edges;
}

export function BlueprintCanvas({ tools, selectedToolId, onSelectTool }: BlueprintCanvasProps) {
  const nodes = useMemo(
    () => buildNodes(tools, selectedToolId ?? null, onSelectTool),
    [tools, selectedToolId, onSelectTool],
  );
  const edges = useMemo(() => buildEdges(tools), [tools]);

  return (
    <div className="h-[480px] w-full overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.5}
        maxZoom={1.5}
        className="bg-none text-[var(--ui-text-primary)]"
        onNodeClick={(_, node) => onSelectTool?.(node.id)}
        onPaneClick={() => onSelectTool?.(null)}
      >
        <MiniMap pannable zoomable className="!bg-[var(--ui-surface)]" />
        <Controls className="!bg-[var(--ui-surface)]" />
        <Background gap={24} color="var(--ui-border)" />
      </ReactFlow>
    </div>
  );
}
