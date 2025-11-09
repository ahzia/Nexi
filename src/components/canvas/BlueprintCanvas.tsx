 "use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import type { ToolDraft } from "@/lib/types/tooling";
import { ToolNode } from "@/components/canvas/ToolNode";
import { PhaseNode } from "@/components/canvas/PhaseNode";
import { ValidationNode } from "@/components/canvas/ValidationNode";
import { TransformNode } from "@/components/canvas/TransformNode";
import { RequestTransformNode } from "@/components/canvas/RequestTransformNode";

type CanvasTool = Omit<ToolDraft, "rawOperation">;

interface BlueprintCanvasProps {
  tools: CanvasTool[];
  selectedToolId?: string | null;
  onSelectTool?: (toolId: string | null) => void;
  onToolDoubleClick?: (tool: CanvasTool) => void;
}

const nodeTypes: NodeTypes = {
  toolNode: ToolNode,
  phaseNode: PhaseNode,
  validationNode: ValidationNode,
  transformNode: TransformNode,
  requestTransformNode: RequestTransformNode,
};

interface GraphResult {
  nodes: Node[];
  edges: Edge[];
}

function buildGraph(
  tools: CanvasTool[],
  selectedToolId: string | null | undefined,
  onSelectTool?: (toolId: string) => void,
): GraphResult {
  const baseY = 80;
  const spacingY = 220;

  const nodes: Node[] = [
    {
      id: "agent-request",
      type: "phaseNode",
      position: { x: -260, y: baseY },
      data: {
        title: "Agent Request",
        subtitle: "LLM issues tools.call",
        kind: "agent-request",
      },
    },
    {
      id: "mcp-runtime",
      type: "phaseNode",
      position: { x: 20, y: baseY },
      data: {
        title: "Nexi Runtime",
        subtitle: "Validate & enrich",
        kind: "runtime",
      },
    },
    {
      id: "upstream-api",
      type: "phaseNode",
      position: { x: 840, y: baseY },
      data: {
        title: "Client API",
        subtitle: "External service",
        kind: "client",
      },
    },
    {
      id: "agent-response",
      type: "phaseNode",
      position: { x: 1140, y: baseY },
      data: {
        title: "Agent Response",
        subtitle: "Structured output",
        kind: "agent-response",
      },
    },
  ];

  const edges: Edge[] = [
    {
      id: "edge-agent-runtime",
      source: "agent-request",
      target: "mcp-runtime",
      type: "smoothstep",
      animated: true,
      style: { stroke: "var(--ui-border-strong)" },
    },
  ];

  let previousStageId = "mcp-runtime";

  tools.forEach((tool, index) => {
    const y = baseY + index * spacingY;
    const httpMeta = tool.httpConfig;
    const requiresValidation =
      (httpMeta?.parameters ?? []).some((param) => param.required) || Boolean(httpMeta?.requestBody?.required);
    const validationNodeId = `${tool.id}-validation`;
    const transformNodeId = `${tool.id}-transform`;
    const requestTransformNodeId = `${tool.id}-request-transform`;

    if (requiresValidation) {
      nodes.push({
        id: validationNodeId,
        type: "validationNode",
        position: { x: 220, y },
        data: {
          requiredParams: (httpMeta?.parameters ?? []).filter((param) => param.required).map((param) => ({
            name: param.name,
            in: param.in,
          })),
          requiresBody: Boolean(httpMeta?.requestBody?.required),
        },
      });
      edges.push({
        id: `${previousStageId}->${validationNodeId}`,
        source: previousStageId,
        target: validationNodeId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--ui-border-strong)" },
      });
      previousStageId = validationNodeId;
    }

    const needsRequestTransform = Boolean(httpMeta?.requestBody?.contentType?.includes("xml"));

    if (needsRequestTransform) {
      nodes.push({
        id: requestTransformNodeId,
        type: "requestTransformNode",
        position: { x: 420, y },
        data: {
          contentType: httpMeta?.requestBody?.contentType,
        },
      });

      edges.push({
        id: `${previousStageId}->${requestTransformNodeId}`,
        source: previousStageId,
        target: requestTransformNodeId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--ui-border-strong)" },
      });

      previousStageId = requestTransformNodeId;
    }

    nodes.push({
      id: tool.id,
      type: "toolNode",
      position: { x: 620, y },
      data: {
        tool,
        selected: tool.id === selectedToolId,
        onInspect: onSelectTool,
      },
    });

    edges.push({
      id: `${previousStageId}->${tool.id}`,
      source: previousStageId,
      target: tool.id,
      type: "smoothstep",
      animated: true,
      style: { stroke: "var(--color-primary-500)" },
    });

    previousStageId = tool.id;

    const hasTransformer =
      Boolean(httpMeta?.responseTransformer) || Boolean(httpMeta?.responseContentType?.includes("xml"));

    if (hasTransformer) {
      nodes.push({
        id: transformNodeId,
        type: "transformNode",
        position: { x: 820, y },
        data: {
          transformer:
            httpMeta?.responseTransformer ??
            (httpMeta?.responseContentType?.includes("xml") ? "xml-to-json" : undefined),
          responseType: httpMeta?.responseContentType,
        },
      });

      edges.push({
        id: `${tool.id}->${transformNodeId}`,
        source: tool.id,
        target: transformNodeId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--color-primary-500)" },
      });

      previousStageId = transformNodeId;
    }
  });

  edges.push({
    id: `${previousStageId}->upstream-api`,
    source: previousStageId,
    target: "upstream-api",
    type: "smoothstep",
    animated: true,
    style: { stroke: "var(--color-success-500)" },
  });

  edges.push({
    id: "edge-upstream-response",
    source: "upstream-api",
    target: "agent-response",
    type: "smoothstep",
    animated: true,
    style: { stroke: "var(--color-primary-500)" },
  });

  return { nodes, edges };
}

export function BlueprintCanvas({ tools, selectedToolId, onSelectTool, onToolDoubleClick }: BlueprintCanvasProps) {
  const { nodes, edges } = useMemo(
    () => buildGraph(tools, selectedToolId ?? null, onSelectTool),
    [tools, selectedToolId, onSelectTool],
  );

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable
        nodesConnectable={false}
        minZoom={0.4}
        maxZoom={1.4}
        panOnDrag
        className="bg-none text-[var(--ui-text-primary)]"
        onNodeClick={(_, node) => onSelectTool?.(node.id)}
        onPaneClick={() => onSelectTool?.(null)}
        onNodeDoubleClick={(_, node) => {
          if (node.type === "toolNode" && onToolDoubleClick) {
            const tool = (node.data as { tool?: CanvasTool })?.tool;
            if (tool) {
              onToolDoubleClick(tool);
            }
          }
        }}
      >
        <MiniMap pannable zoomable className="!bg-[var(--ui-surface)]" />
        <Controls className="!bg-[var(--ui-surface)]" />
        <Background gap={24} color="var(--ui-border)" />
      </ReactFlow>
    </div>
  );
}
