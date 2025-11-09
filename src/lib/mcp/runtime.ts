import { ValidationError, validateToolArguments } from "./validation";
import { buildHttpRequest } from "./http";
import { transformResponse } from "./transformers";
import type { ExecutionResult, RuntimeTool } from "./types";

interface ExecuteOptions {
  inputSchema?: unknown;
}

export async function executeHttpTool(
  tool: RuntimeTool,
  args: Record<string, unknown>,
  options: ExecuteOptions = {},
): Promise<ExecutionResult> {
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

  validateToolArguments(metadata, args);

  const request = buildHttpRequest({
    baseUrl,
    pathTemplate,
    method,
    args,
    httpMeta,
    inputSchema: options.inputSchema,
  });

  const response = await fetch(request.url, {
    method,
    headers: request.headers,
    body: request.body,
  });

  const responseText = await response.text();
  const summary = response.ok
    ? `✅ ${tool.name} responded with status ${response.status}.`
    : `⚠️ ${tool.name} returned error status ${response.status}.`;

  const { structuredContent, additionalText } = transformResponse({
    transformer: httpMeta?.responseTransformer,
    contentType: httpMeta?.responseContentType,
    bodyText: responseText,
  });

  const contentBlocks = [
    {
      type: "text" as const,
      text: summary,
    },
  ];

  if (additionalText) {
    contentBlocks.push({ type: "text" as const, text: additionalText });
  } else if (typeof structuredContent !== "object") {
    contentBlocks.push({ type: "text" as const, text: responseText || "(empty response body)" });
  }

  return {
    content: contentBlocks,
    structuredContent,
    isError: !response.ok,
  };
}

export { ValidationError };
