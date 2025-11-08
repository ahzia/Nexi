import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

const JSON_RPC_VERSION = "2.0";

interface JsonRpcRequest {
  jsonrpc: string;
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface ToolMetadata {
  method?: string;
  path?: string;
  httpConfig?: {
    baseUrl?: string;
    parameters?: Array<{
      name: string;
      in: "query" | "path" | "header";
      required: boolean;
    }>;
    requestBody?: {
      propertyName: string;
      contentType?: string;
      required: boolean;
    };
    responseContentType?: string;
  } | null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdminClient();

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
  }
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

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

  const valid = await bcrypt.compare(token, instance.api_key_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
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
        const executionResult = await executeHttpTool({
          tool,
          args: argumentsObject,
        });
        return NextResponse.json(makeResult(body.id, executionResult));
      } catch (error) {
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

type HttpParameters = NonNullable<ToolMetadata["httpConfig"]>["parameters"];

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

async function executeHttpTool({
  tool,
  args,
}: {
  tool: {
    name: string;
    description: string | null;
    schema: unknown;
    output_schema: unknown;
    instructions: string | null;
    is_active: boolean;
    metadata: ToolMetadata | null;
  };
  args: Record<string, unknown>;
}) {
  const metadata = tool.metadata ?? {};
  const httpMeta = metadata.httpConfig ?? undefined;
  const baseUrl = httpMeta?.baseUrl ?? process.env.NEXI_DEFAULT_BASE_URL;
  const pathTemplate = metadata.path ?? "";
  const method = (metadata.method ?? "get").toUpperCase();

  if (!baseUrl) {
    throw new Error(
      `No base URL defined for tool "${tool.name}". Add a server URL to the OpenAPI spec or set NEXI_DEFAULT_BASE_URL.`,
    );
  }

  const { url, headers, body } = buildHttpRequest({
    baseUrl,
    pathTemplate,
    method,
    args,
    httpMeta,
  });

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  const responseText = await response.text();
  let parsedBody: unknown = undefined;
  try {
    parsedBody = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    // Non-JSON response
  }

  const summary = response.ok
    ? `✅ ${tool.name} responded with status ${response.status}.`
    : `⚠️ ${tool.name} returned error status ${response.status}.`;

  const contentBlocks = [
    {
      type: "text" as const,
      text: summary,
    },
  ];

  if (!parsedBody) {
    contentBlocks.push({
      type: "text" as const,
      text: responseText || "(empty response body)",
    });
  }

  return {
    content: contentBlocks,
    structuredContent: parsedBody ?? { raw: responseText },
    isError: !response.ok,
  };
}

function buildHttpRequest({
  baseUrl,
  pathTemplate,
  method,
  args,
  httpMeta,
}: {
  baseUrl: string;
  pathTemplate: string;
  method: string;
  args: Record<string, unknown>;
  httpMeta?: ToolMetadata["httpConfig"];
}) {
  const headers = new Headers();
  headers.set("Accept", httpMeta?.responseContentType ?? "application/json");

  const replacedPath = replacePathParams(pathTemplate, args, httpMeta?.parameters);
  const url = new URL(replacedPath.startsWith("/") ? replacedPath.slice(1) : replacedPath, ensureTrailingSlash(baseUrl));

  if (httpMeta?.parameters) {
    httpMeta.parameters.forEach((param) => {
      const value = args[param.name];
      if (value === undefined || value === null) {
        return;
      }
      if (param.in === "query") {
        url.searchParams.set(param.name, String(value));
      }
      if (param.in === "header") {
        headers.set(param.name, String(value));
      }
    });
  }

  let body: string | undefined;
  if (httpMeta?.requestBody) {
    const bodyValue = args[httpMeta.requestBody.propertyName];
    if (bodyValue !== undefined) {
      headers.set("Content-Type", httpMeta.requestBody.contentType ?? "application/json");
      body = headers.get("Content-Type")?.includes("application/json") ? JSON.stringify(bodyValue) : String(bodyValue);
    }
  }

  if (method === "GET" || method === "HEAD") {
    body = undefined;
  }

  return { url: url.toString(), headers, body };
}

function replacePathParams(
  template: string,
  args: Record<string, unknown>,
  parameters?: HttpParameters,
) {
  if (!template.includes("{")) return template;
  return template.replace(/\{([^}]+)\}/g, (fullMatch, paramName) => {
    const parameter = parameters?.find((param) => param.in === "path" && param.name === paramName);
    if (!parameter) {
      return args[paramName] !== undefined ? encodeURIComponent(String(args[paramName])) : fullMatch;
    }
    const value = args[paramName];
    if (value === undefined || value === null) {
      throw new Error(`Missing required path parameter "${paramName}".`);
    }
    return encodeURIComponent(String(value));
  });
}

function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}
