import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";

import { executeHttpTool, ValidationError } from "@/lib/mcp/runtime";
import type { RuntimeTool, ToolMetadata } from "@/lib/mcp/types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  addCorsHeaders,
  jsonRpcResponse,
  makeError,
  makeResult,
  INVALID_REQUEST,
  INVALID_PARAMS,
  METHOD_NOT_FOUND,
  INTERNAL_ERROR,
  PARSE_ERROR,
} from "@/lib/mcp/jsonrpc";
import { createStreamResponse } from "@/lib/mcp/stream";

const JSON_RPC_VERSION = "2.0";

interface JsonRpcRequest {
  jsonrpc?: string;
  id: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface McpInstanceRecord {
  id: string;
  slug: string;
  display_name: string | null;
  api_key_hash: string | null;
  capabilities: unknown;
  discovery_payload: unknown;
}

async function loadInstance(slug: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("mcp_instances")
    .select("id, slug, display_name, api_key_hash, capabilities, discovery_payload")
    .eq("slug", slug)
    .maybeSingle();
  return { data: data as McpInstanceRecord | null, error, supabase } as const;
}

async function withInstance(
  slug: string,
  handler: (instance: McpInstanceRecord, supabase: ReturnType<typeof getSupabaseAdminClient>) => Promise<NextResponse>,
) {
  const { data, error, supabase } = await loadInstance(slug);
  if (error) {
    return addCorsHeaders(NextResponse.json({ error: error.message }, { status: 500 }));
  }
  if (!data) {
    return addCorsHeaders(NextResponse.json({ error: "MCP instance not found" }, { status: 404 }));
  }
  return handler(data, supabase);
}

export async function HEAD(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const response = await withInstance(slug, async () => addCorsHeaders(NextResponse.json(null, { status: 200 })));
  response.headers.set("Allow", "GET, POST, OPTIONS");
  return response;
}

export async function OPTIONS(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withInstance(slug, async () => addCorsHeaders(NextResponse.json(null, { status: 204 })));
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withInstance(slug, async (instance) =>
    addCorsHeaders(
      NextResponse.json({
        slug: instance.slug,
        discovery: instance.discovery_payload ?? {},
        capabilities: instance.capabilities ?? defaultCapabilities(),
      }),
    ),
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withInstance(slug, async (instance, supabase) => {
    const authHeader = req.headers.get("authorization");
    if (instance.api_key_hash) {
      if (!authHeader?.startsWith("Bearer ")) {
        return addCorsHeaders(NextResponse.json({ error: "Missing authorization header" }, { status: 401 }));
      }
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      const valid = await bcrypt.compare(token, instance.api_key_hash);
      if (!valid) {
        return addCorsHeaders(NextResponse.json({ error: "Invalid API key" }, { status: 401 }));
      }
    }

    const parsed = await parseJsonRpc(req);
    if (!parsed.ok) {
      return jsonRpcResponse(makeError(parsed.id, parsed.code, parsed.message));
    }
    const body = parsed.request;

    if (body.jsonrpc !== JSON_RPC_VERSION) {
      return jsonRpcResponse(makeError(body.id, INVALID_REQUEST, "Invalid JSON-RPC version"));
    }
    if (!body.method) {
      return jsonRpcResponse(makeError(body.id, INVALID_REQUEST, "Method is required"));
    }

    const { data: tools, error: toolsError } = await supabase
      .from("tool_versions")
      .select("name, description, schema, output_schema, instructions, is_active, metadata")
      .eq("mcp_instance_id", instance.id)
      .eq("is_active", true);

    if (toolsError) {
      return jsonRpcResponse(makeError(body.id, INTERNAL_ERROR, toolsError.message));
    }

    switch (body.method) {
      case "initialize": {
        const sessionId = randomUUID();
        const result = {
          sessionId,
          serverInfo: {
            name: instance.display_name ?? slug,
            description: "Nexi-generated MCP server",
          },
          capabilities: instance.capabilities ?? defaultCapabilities(),
        };
        const response = jsonRpcResponse(makeResult(body.id, result));
        response.headers.set("Mcp-Session-Id", sessionId);
        return response;
      }
      case "tools/list": {
        const result = {
          tools: (tools ?? []).map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.schema,
            outputSchema: tool.output_schema ?? undefined,
          })),
        };
        return jsonRpcResponse(makeResult(body.id, result));
      }
      case "tools/call": {
        const toolName = body.params?.name as string | undefined;
        if (!toolName) {
          return jsonRpcResponse(makeError(body.id, INVALID_PARAMS, "Tool name is required"));
        }
        const tool = (tools ?? []).find((t) => t.name === toolName);
        if (!tool) {
          return jsonRpcResponse(makeError(body.id, -32004, `Unknown tool: ${toolName}`));
        }

        try {
          const argumentsObject = (body.params?.arguments ?? {}) as Record<string, unknown>;
          const runtimeTool: RuntimeTool = {
            name: tool.name,
            description: tool.description,
            instructions: tool.instructions,
            metadata: (tool.metadata ?? {}) as ToolMetadata,
          };
          const executionResult = await executeHttpTool(runtimeTool, argumentsObject);
          return jsonRpcResponse(makeResult(body.id, executionResult));
        } catch (error) {
          if (error instanceof ValidationError) {
            return jsonRpcResponse(makeError(body.id, INVALID_PARAMS, formatValidationMessage(error)));
          }
          return jsonRpcResponse(makeError(body.id, INTERNAL_ERROR, (error as Error).message ?? "Failed to execute tool"));
        }
      }
      case "prompts/list": {
        return jsonRpcResponse(makeResult(body.id, { prompts: [] }));
      }
      case "resources/list": {
        return jsonRpcResponse(makeResult(body.id, { resources: [] }));
      }
      case "notifications/subscribe":
      case "notifications/unsubscribe":
      case "heartbeat/ping":
      case "ping": {
        return jsonRpcResponse(makeResult(body.id, null));
      }
      case "discovery": {
        return jsonRpcResponse(makeResult(body.id, instance.discovery_payload ?? {}));
      }
      default:
        return jsonRpcResponse(makeError(body.id, METHOD_NOT_FOUND, `Unsupported method: ${body.method}`));
    }
  });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  if (req.headers.get("content-type")?.includes("application/mcp+jsonlines")) {
    const { slug } = await context.params;
    return withInstance(slug, async (instance, supabase) =>
      createStreamResponse(async (write) => {
        const authHeader = req.headers.get("authorization");
        if (instance.api_key_hash) {
          if (!authHeader?.startsWith("Bearer ")) {
            write(JSON.stringify(makeError(null, INVALID_REQUEST, "Missing authorization header")));
            return;
          }
          const token = authHeader.replace(/^Bearer\s+/i, "").trim();
          const valid = await bcrypt.compare(token, instance.api_key_hash);
          if (!valid) {
            write(JSON.stringify(makeError(null, INVALID_REQUEST, "Invalid API key")));
            return;
          }
        }

        const reader = req.body?.getReader();
        if (!reader) {
          write(JSON.stringify(makeError(null, PARSE_ERROR, "No request body")));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = await processBuffer(buffer, instance, supabase, write);
        }
        if (buffer.trim()) {
          await processBuffer(buffer, instance, supabase, write, true);
        }
      }),
    );
  }

  return addCorsHeaders(NextResponse.json({ error: "Unsupported transport" }, { status: 400 }));
}

function defaultCapabilities() {
  return {
    tools: {
      listChangedNotification: true,
      callTool: {
        resultStreaming: false,
      },
    },
    resources: {
      listChangedNotification: false,
    },
    prompts: {
      listChangedNotification: false,
    },
  };
}

function formatValidationMessage(error: ValidationError) {
  if (!error.details || error.details.length === 0) {
    return error.message;
  }
  return `${error.message}: ${error.details.join(" ")}`;
}

async function parseJsonRpc(
  req: NextRequest,
): Promise<{ ok: true; request: JsonRpcRequest } | { ok: false; id: JsonRpcRequest["id"]; code: number; message: string }>
{
  try {
    const text = await req.text();
    if (!text.trim()) {
      return { ok: false, id: null, code: INVALID_REQUEST, message: "Empty request payload" };
    }
    const parsed = JSON.parse(text) as JsonRpcRequest;
    return { ok: true, request: parsed };
  } catch (error) {
    const isSyntax = error instanceof SyntaxError;
    return {
      ok: false,
      id: null,
      code: isSyntax ? PARSE_ERROR : INTERNAL_ERROR,
      message: isSyntax ? "Parse error" : (error as Error).message ?? "Failed to parse request",
    };
  }
}

async function processBuffer(
  buffer: string,
  instance: McpInstanceRecord,
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  write: (payload: string) => void,
  finalChunk = false,
) {
  const lines = buffer.split(/\r?\n/);
  const incomplete = lines.pop() ?? "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const request = JSON.parse(trimmed) as JsonRpcRequest;
      const response = await handleJsonRpcRequest(request, instance, supabase);
      write(JSON.stringify(response));
    } catch (error) {
      write(JSON.stringify(makeError(null, PARSE_ERROR, (error as Error).message ?? "Parse error")));
    }
  }

  if (finalChunk && incomplete.trim()) {
    try {
      const request = JSON.parse(incomplete) as JsonRpcRequest;
      const response = await handleJsonRpcRequest(request, instance, supabase);
      write(JSON.stringify(response));
      return "";
    } catch (error) {
      write(JSON.stringify(makeError(null, PARSE_ERROR, (error as Error).message ?? "Parse error")));
      return "";
    }
  }

  return incomplete;
}

async function handleJsonRpcRequest(
  body: JsonRpcRequest,
  instance: McpInstanceRecord,
  supabase: ReturnType<typeof getSupabaseAdminClient>,
) {
  if (body.jsonrpc !== JSON_RPC_VERSION) {
    return makeError(body.id, INVALID_REQUEST, "Invalid JSON-RPC version");
  }
  if (!body.method) {
    return makeError(body.id, INVALID_REQUEST, "Method is required");
  }

  const { data: tools, error: toolsError } = await supabase
    .from("tool_versions")
    .select("name, description, schema, output_schema, instructions, is_active, metadata")
    .eq("mcp_instance_id", instance.id)
    .eq("is_active", true);

  if (toolsError) {
    return makeError(body.id, INTERNAL_ERROR, toolsError.message);
  }

  switch (body.method) {
    case "initialize": {
      const sessionId = randomUUID();
      return makeResult(body.id, {
        sessionId,
        serverInfo: {
          name: instance.display_name ?? instance.slug,
          description: "Nexi-generated MCP server",
        },
        capabilities: instance.capabilities ?? defaultCapabilities(),
      });
    }
    case "tools/list": {
      const result = {
        tools: (tools ?? []).map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.schema,
          outputSchema: tool.output_schema ?? undefined,
        })),
      };
      return makeResult(body.id, result);
    }
    case "tools/call": {
      const toolName = body.params?.name as string | undefined;
      if (!toolName) {
        return makeError(body.id, INVALID_PARAMS, "Tool name is required");
      }
      const tool = (tools ?? []).find((t) => t.name === toolName);
      if (!tool) {
        return makeError(body.id, -32004, `Unknown tool: ${toolName}`);
      }
      try {
        const argumentsObject = (body.params?.arguments ?? {}) as Record<string, unknown>;
        const runtimeTool: RuntimeTool = {
          name: tool.name,
          description: tool.description,
          instructions: tool.instructions,
          metadata: (tool.metadata ?? {}) as ToolMetadata,
        };
        const executionResult = await executeHttpTool(runtimeTool, argumentsObject);
        return makeResult(body.id, executionResult);
      } catch (error) {
        if (error instanceof ValidationError) {
          return makeError(body.id, INVALID_PARAMS, formatValidationMessage(error));
        }
        return makeError(body.id, INTERNAL_ERROR, (error as Error).message ?? "Failed to execute tool");
      }
    }
    case "prompts/list":
      return makeResult(body.id, { prompts: [] });
    case "resources/list":
      return makeResult(body.id, { resources: [] });
    case "notifications/subscribe":
    case "notifications/unsubscribe":
    case "heartbeat/ping":
    case "ping":
      return makeResult(body.id, null);
    case "discovery":
      return makeResult(body.id, instance.discovery_payload ?? {});
    default:
      return makeError(body.id, METHOD_NOT_FOUND, `Unsupported method: ${body.method}`);
  }
}
