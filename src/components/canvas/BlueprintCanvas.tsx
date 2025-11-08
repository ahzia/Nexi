"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node, type NodeTypes } from "reactflow";
import "reactflow/dist/style.css";

import type { ToolDraft } from "@/lib/types/tooling";
import { ToolNode } from "@/components/canvas/ToolNode";
import { PhaseNode } from "@/components/canvas/PhaseNode";

type CanvasTool = Omit<ToolDraft, "rawOperation">;

interface BlueprintCanvasProps {
  tools: CanvasTool[];
  selectedToolId?: string | null;
  onSelectTool?: (toolId: string | null) => void;
}

const nodeTypes: NodeTypes = {
  toolNode: ToolNode,
  phaseNode: PhaseNode,
};

function buildGraph(
  tools: CanvasTool[],
  selectedToolId: string | null | undefined,
  onSelectTool?: (toolId: string) => void,
): { nodes: Node[]; edges: Edge[] } {
  const baseY = 120;
  const nodes: Node[] = [
    {
      id: "agent-request",
      type: "phaseNode",
      position: { x: -260, y: baseY },
      data: {
        title: "Agent Request",
        subtitle: "ChatGPT / Claude issues tools.call",
      },
    },
    {
      id: "mcp-runtime",
      type: "phaseNode",
      position: { x: -20, y: baseY },
      data: {
        title: "Nexi MCP Runtime",
        subtitle: "Validate payload · map to HTTP",
      },
    },
    {
      id: "upstream-api",
      type: "phaseNode",
      position: { x: 460, y: baseY },
      data: {
        title: "Client API",
        subtitle: "REST call · parse response",
      },
    },
    {
      id: "agent-response",
      type: "phaseNode",
      position: { x: 720, y: baseY },
      data: {
        title: "Agent Response",
        subtitle: "Structured content returned",
      },
    },
  ];

  const edges: Edge[] = [
    {
      id: "edge-agent-mcp",
      source: "agent-request",
      target: "mcp-runtime",
      type: "smoothstep",
      animated: true,
      style: { stroke: "var(--color-primary-500)" },
    },
  ];

  const toolX = 200;
  const toolSpacing = 170;

  tools.forEach((tool, index) => {
    nodes.push({
      id: tool.id,
      type: "toolNode",
      position: { x: toolX, y: index * toolSpacing },
      data: {
        tool,
        selected: tool.id === selectedToolId,
        onInspect: onSelectTool,
      },
    });

    const sourceId = index === 0 ? "mcp-runtime" : tools[index - 1].id;
    edges.push({
      id: `${sourceId}->${tool.id}`,
      source: sourceId,
      target: tool.id,
      type: "smoothstep",
      animated: true,
      style: { stroke: "var(--color-primary-500)" },
    });
  });

  const finalSource = tools.length > 0 ? tools[tools.length - 1].id : "mcp-runtime";
  edges.push({
    id: `${finalSource}->upstream-api`,
    source: finalSource,
    target: "upstream-api",
    type: "smoothstep",
    animated: true,
    style: { stroke: "var(--color-primary-500)" },
  });

  edges.push({
    id: "edge-api-response",
    source: "upstream-api",
    target: "agent-response",
    type: "smoothstep",
    animated: true,
    style: { stroke: "var(--color-primary-500)" },
  });

  return { nodes, edges };
}

export function BlueprintCanvas({ tools, selectedToolId, onSelectTool }: BlueprintCanvasProps) {
  const { nodes, edges } = useMemo(
    () => buildGraph(tools, selectedToolId ?? null, onSelectTool),
    [tools, selectedToolId, onSelectTool],
  );

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
