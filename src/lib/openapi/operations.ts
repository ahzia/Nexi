import { z } from "zod";

import type { IngestionWarning, ToolDraft } from "@/lib/types/tooling";
import { ensureMaxLength, fallbackOperationId, toKebabCase } from "@/lib/utils/string";

import { buildInputSchema, buildOutputSchema } from "./schema";
import type { OperationWithPath } from "./types";

const HttpMethodSchema = z.enum(["get", "put", "post", "delete", "options", "head", "patch", "trace"]);

export function extractOperations(document: OperationWithPath["document"]): OperationWithPath[] {
  const entries: OperationWithPath[] = [];
  if (!document.paths) {
    return entries;
  }

  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (!pathItem) continue;

    for (const [rawMethod, operation] of Object.entries(pathItem)) {
      if (!operation) continue;
      const parseResult = HttpMethodSchema.safeParse(rawMethod);
      if (!parseResult.success) continue;
      const typedOperation = operation as OperationWithPath["operation"];
      entries.push({
        document,
        method: parseResult.data,
        path,
        operation: typedOperation,
      });
    }
  }

  return entries;
}

export function mapOperationToTool({ document, method, path, operation }: OperationWithPath, warnings: IngestionWarning[]): ToolDraft {
  const preferredId = operation.operationId ?? fallbackOperationId(method, path);
  if (!operation.operationId) {
    warnings.push({
      id: `missing-operation-id-${method}-${path}`,
      level: "info",
      message: `Generated operation id "${preferredId}" because operationId was missing.`,
      operationId: preferredId,
    });
  }

  const name = ensureMaxLength(toKebabCase(preferredId));
  const description =
    operation.description?.trim() ||
    operation.summary?.trim() ||
    `Invoke ${method.toUpperCase()} ${path} on the upstream service.`;

  const { inputSchema, schemaWarnings, httpConfig } = buildInputSchema(operation, method, path);
  warnings.push(...schemaWarnings);
  const { schema: outputSchema, contentType: responseContentType } = buildOutputSchema(operation);

  const responseTransformer = responseContentType?.includes("xml") ? "xml-to-json" : undefined;

  return {
    id: preferredId,
    name,
    description,
    summary: operation.summary?.trim(),
    method,
    path,
    tags: operation.tags ?? [],
    inputSchema,
    outputSchema,
    security: operation.security,
    httpConfig: {
      baseUrl: resolveBaseUrl(operation, document),
      parameters: httpConfig.parameters,
      requestBody: httpConfig.requestBody,
      responseContentType,
      responseTransformer,
    },
    rawOperation: operation,
  };
}

function resolveBaseUrl(operation: OperationWithPath["operation"], document: OperationWithPath["document"]): string | undefined {
  const opServer = Array.isArray(operation.servers) && operation.servers.length > 0 ? operation.servers[0]?.url : undefined;
  if (opServer) return opServer;
  if (Array.isArray(document.servers) && document.servers.length > 0) {
    return document.servers[0]?.url;
  }
  return undefined;
}

