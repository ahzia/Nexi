import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";

import { executeHttpTool, ValidationError } from "@/lib/mcp/runtime";
import type { RuntimeTool, ToolMetadata } from "@/lib/mcp/types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const JSON_RPC_VERSION = "2.0";

interface JsonRpcRequest {
  jsonrpc: string;
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: instance, error: instanceError } = await supabase
    .from("mcp_instances")
    .select("id, slug, display_name, api_key_hash, capabilities, discovery_payload")
    .eq("slug", slug)
    .maybeSingle();

  if (instanceError) {
    return NextResponse.json({ error: instanceError.message }, { status: 500 });
  }
  if (!instance) {
    return NextResponse.json({ error: "MCP instance not found" }, { status: 404 });
  }

  const authHeader = req.headers.get("authorization");
  if (instance.api_key_hash) {
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const valid = await bcrypt.compare(token, instance.api_key_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
  }

  const body = (await req.json()) as JsonRpcRequest;
  if (body.jsonrpc !== JSON_RPC_VERSION) {
    return NextResponse.json(makeError(body.id, -32600, "Invalid JSON-RPC version"), { status: 400 });
  }

  const { data: tools, error: toolsError } = await supabase
    .from("tool_versions")
    .select("name, description, schema, output_schema, instructions, is_active, metadata")
    .eq("mcp_instance_id", instance.id)
    .eq("is_active", true);

  if (toolsError) {
    return NextResponse.json(makeError(body.id, -32000, toolsError.message), { status: 500 });
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
      const response = NextResponse.json(makeResult(body.id, result));
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
      return NextResponse.json(makeResult(body.id, result));
    }
    case "tools/call": {
      const toolName = body.params?.name as string | undefined;
      if (!toolName) {
        return NextResponse.json(makeError(body.id, -32602, "Tool name is required"), { status: 400 });
      }
      const tool = (tools ?? []).find((t) => t.name === toolName);
      if (!tool) {
        return NextResponse.json(makeError(body.id, -32004, `Unknown tool: ${toolName}`), { status: 404 });
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
        return NextResponse.json(makeResult(body.id, executionResult));
      } catch (error) {
        if (error instanceof ValidationError) {
          return NextResponse.json(makeError(body.id, -32602, formatValidationMessage(error)), { status: 422 });
        }
        return NextResponse.json(
          makeError(body.id, -32010, (error as Error).message ?? "Failed to execute tool"),
          { status: 500 },
        );
      }
    }
    default:
      return NextResponse.json(makeError(body.id, -32601, `Unsupported method: ${body.method}`), { status: 400 });
  }
}

function makeResult(id: JsonRpcRequest["id"], result: unknown) {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    result,
  };
}

function makeError(id: JsonRpcRequest["id"], code: number, message: string) {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id,
    error: {
      code,
      message,
    },
  };
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
