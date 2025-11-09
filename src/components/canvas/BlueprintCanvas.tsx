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
  const baseY = 120;
  const spacingY = 300;

  const columns = {
    agent: -200,
    runtime: 60,
    validation: 400,
    prepare: 760,
    tool: 1140,
    transform: 1520,
    upstream: 1720,
    response: 2100,
  };

  const nodes: Node[] = [
    {
      id: "agent-request",
      type: "phaseNode",
      position: { x: columns.agent, y: baseY },
      data: {
        title: "Agent Request",
        subtitle: "LLM issues tools.call",
        kind: "agent-request",
      },
    },
    {
      id: "mcp-runtime",
      type: "phaseNode",
      position: { x: columns.runtime, y: baseY },
      data: {
        title: "Nexi Runtime",
        subtitle: "Validate & enrich",
        kind: "runtime",
      },
    },
    {
      id: "upstream-api",
      type: "phaseNode",
      position: { x: columns.upstream, y: 0 },
      data: {
        title: "Client API",
        subtitle: "External service",
        kind: "client",
      },
    },
    {
      id: "agent-response",
      type: "phaseNode",
      position: { x: columns.response, y: baseY },
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

  tools.forEach((tool, index) => {
    const rowIndex = index % 3;
    const laneOffset = Math.floor(index / 3) * 80;
    const y = baseY + rowIndex * spacingY + laneOffset;
    const httpMeta = tool.httpConfig;
    const requiresValidation =
      (httpMeta?.parameters ?? []).some((param) => param.required) || Boolean(httpMeta?.requestBody?.required);
    const validationNodeId = `${tool.id}-validation`;
    const transformNodeId = `${tool.id}-transform`;
    let finalNodeId = tool.id;
    const requestTransformNodeId = `${tool.id}-request-transform`;
    let lastNodeId = "mcp-runtime";

    if (requiresValidation) {
      nodes.push({
        id: validationNodeId,
        type: "validationNode",
        position: { x: columns.validation, y },
        data: {
          requiredParams: (httpMeta?.parameters ?? []).filter((param) => param.required).map((param) => ({
            name: param.name,
            in: param.in,
          })),
          requiresBody: Boolean(httpMeta?.requestBody?.required),
        },
      });
      edges.push({
        id: `edge-${tool.id}-runtime-validation`,
        source: lastNodeId,
        target: validationNodeId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--ui-border-strong)" },
      });
      lastNodeId = validationNodeId;
    }

    const needsRequestTransform = Boolean(httpMeta?.requestBody?.contentType?.includes("xml"));

    if (needsRequestTransform) {
      nodes.push({
        id: requestTransformNodeId,
        type: "requestTransformNode",
        position: { x: columns.prepare, y },
        data: {
          contentType: httpMeta?.requestBody?.contentType,
        },
      });

      edges.push({
        id: `edge-${tool.id}-validation-request`,
        source: lastNodeId,
        target: requestTransformNodeId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--ui-border-strong)" },
      });

      lastNodeId = requestTransformNodeId;
    }

    nodes.push({
      id: tool.id,
      type: "toolNode",
      position: { x: columns.tool, y },
      data: {
        tool,
        selected: tool.id === selectedToolId,
        onInspect: onSelectTool,
      },
    });

    edges.push({
      id: `edge-${tool.id}-request-tool`,
      source: lastNodeId,
      target: tool.id,
      type: "smoothstep",
      animated: true,
      style: { stroke: "var(--color-primary-500)" },
    });

    lastNodeId = tool.id;

    const hasTransformer =
      Boolean(httpMeta?.responseTransformer) || Boolean(httpMeta?.responseContentType?.includes("xml"));

    if (hasTransformer) {
      nodes.push({
        id: transformNodeId,
        type: "transformNode",
        position: { x: columns.transform, y },
        data: {
          transformer:
            httpMeta?.responseTransformer ??
            (httpMeta?.responseContentType?.includes("xml") ? "xml-to-json" : undefined),
          responseType: httpMeta?.responseContentType,
        },
      });

      edges.push({
        id: `edge-${tool.id}-tool-transform`,
        source: lastNodeId,
        target: transformNodeId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--color-primary-500)" },
      });

      lastNodeId = transformNodeId;
      finalNodeId = transformNodeId;
    } else {
      finalNodeId = tool.id;
      lastNodeId = tool.id;
    }

    edges.push({
      id: `edge-${tool.id}-tool-upstream`,
      source: tool.id,
      target: "upstream-api",
      type: "smoothstep",
      animated: true,
      style: { stroke: "var(--color-success-500)" },
    });

    if (finalNodeId !== tool.id) {
      edges.push({
        id: `edge-${tool.id}-transform-response`,
        source: finalNodeId,
        target: "agent-response",
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--color-primary-500)" },
      });
    } else {
      edges.push({
        id: `edge-${tool.id}-tool-response`,
        source: tool.id,
        target: "agent-response",
        type: "smoothstep",
        animated: true,
        style: { stroke: "var(--color-primary-500)" },
      });
    }
  });

  return { nodes, edges };
}

export function BlueprintCanvas({ tools, selectedToolId, onSelectTool, onToolDoubleClick }: BlueprintCanvasProps) {
  const { nodes, edges } = useMemo(
    () => buildGraph(tools, selectedToolId ?? null, onSelectTool),
    [tools, selectedToolId, onSelectTool],
  );

  return (
    <div className="min-h-[420px] w-full overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 sm:h-[500px] lg:h-[620px]">
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
        <MiniMap pannable zoomable className="hidden !bg-[var(--ui-surface)] lg:block" />
        <Controls className="!bg-[var(--ui-surface)]" />
        <Background gap={24} color="var(--ui-border)" />
      </ReactFlow>
    </div>
  );
}
