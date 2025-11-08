import { dereference } from '@readme/openapi-parser';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod';
import YAML from 'yaml';

import type { HttpMethod, IngestedApiSpec, IngestionWarning, OpenAPIDocument, ToolDraft } from '../types/tooling';
import { ensureMaxLength, fallbackOperationId, toKebabCase } from '../utils/string';

const HttpMethodSchema = z.enum(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

type OperationWithPath = {
  document: OpenAPIDocument;
  method: HttpMethod;
  path: string;
  operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
};

export interface IngestOpenApiOptions {
  /**
   * Raw source content (JSON or YAML). If you already have a parsed document,
   * pass it via `document` instead.
   */
  source?: string;
  /**
   * Pre-parsed OpenAPI document. When provided, `source` is ignored.
   */
  document?: unknown;
  /**
   * Optional hint used in warning messages and generated IDs.
   */
  sourceName?: string;
}

export async function ingestOpenApiSpec(options: IngestOpenApiOptions): Promise<IngestedApiSpec> {
  const { document, errors } = await loadDocument(options);
  const operations = extractOperations(document);
  const tools: ToolDraft[] = operations.map((operation) => mapOperationToTool(operation, errors));
  return { document, tools, errors };
}

async function loadDocument(options: IngestOpenApiOptions): Promise<{ document: OpenAPIDocument; errors: IngestionWarning[] }> {
  const errors: IngestionWarning[] = [];

  if (!options.source && !options.document) {
    throw new Error('Either `source` or `document` must be provided when ingesting an OpenAPI specification.');
  }

  let initial: unknown;
  if (options.document) {
    initial = options.document;
  } else if (options.source) {
    initial = parseSource(options.source);
  }

  const dereferenced = (await dereference(initial as Record<string, unknown>)) as OpenAPIDocument;
  return { document: dereferenced, errors };
}

function parseSource(source: string): unknown {
  const trimmed = source.trim();
  if (!trimmed) throw new Error('Received empty OpenAPI source.');

  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  return YAML.parse(trimmed);
}

function extractOperations(document: OpenAPIDocument): OperationWithPath[] {
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
      entries.push({
        document,
        method: parseResult.data,
        path,
        operation: operation as OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject,
      });
    }
  }

  return entries;
}

function mapOperationToTool({ method, path, operation }: OperationWithPath, warnings: IngestionWarning[]): ToolDraft {
  const preferredId = operation.operationId ?? fallbackOperationId(method, path);
  if (!operation.operationId) {
    warnings.push({
      id: `missing-operation-id-${method}-${path}`,
      level: 'info',
      message: `Generated operation id "${preferredId}" because operationId was missing.`,
      operationId: preferredId,
    });
  }

  const name = ensureMaxLength(toKebabCase(preferredId));
  const description =
    operation.description?.trim() ||
    operation.summary?.trim() ||
    `Invoke ${method.toUpperCase()} ${path} on the upstream service.`;

  const { inputSchema, schemaWarnings } = buildInputSchema(operation, method, path);
  warnings.push(...schemaWarnings);
  const outputSchema = buildOutputSchema(operation);

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
    rawOperation: operation,
  };
}

type JsonSchema = Record<string, unknown>;

function buildInputSchema(
  operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject,
  method: HttpMethod,
  path: string,
): { inputSchema: unknown; schemaWarnings: IngestionWarning[] } {
  const schemaWarnings: IngestionWarning[] = [];
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  const parameters: (OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject)[] = Array.isArray(operation.parameters)
    ? (operation.parameters as (OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject)[])
    : [];

  for (const parameter of parameters) {
    const name = parameter.name;
    const schema = (parameter.schema ?? { type: 'string' }) as JsonSchema;
    properties[name] = {
      ...schema,
      in: (parameter as OpenAPIV3.ParameterObject).in,
      description: parameter.description,
      example: (parameter as OpenAPIV3.ParameterObject).example,
    };
    if (parameter.required) {
      required.push(name);
    }
  }

  const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject | undefined;
  if (requestBody?.content) {
    const bodySchema = pickFirstJsonSchema(requestBody.content);
    if (bodySchema) {
      const bodyPropertyName = resolveBodyProperty(properties);
      properties[bodyPropertyName] = {
        ...bodySchema,
        description: requestBody.description ?? 'Request payload.',
      };
      if (requestBody.required) {
        required.push(bodyPropertyName);
      }
    } else {
      schemaWarnings.push({
        id: `missing-request-body-schema-${method}-${path}`,
        level: 'warning',
        message: 'Could not determine request body schema for operation.',
        operationId: operation.operationId,
      });
    }
  }

  return {
    inputSchema: {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false,
    },
    schemaWarnings,
  };
}

function resolveBodyProperty(existing: Record<string, unknown>): string {
  if (!('body' in existing)) {
    return 'body';
  }
  let index = 1;
  while (`body${index}` in existing) {
    index += 1;
  }
  return `body${index}`;
}

function pickFirstJsonSchema(
  content: Record<string, OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject>,
): OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject | undefined {
  const entries = Object.entries(content);
  if (entries.length === 0) return undefined;

  // Prefer JSON-like media types
  const jsonEntry = entries.find(([type]) => type.includes('json'));
  const target = (jsonEntry ?? entries[0])[1];

  return target.schema as OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject | undefined;
}

function buildOutputSchema(
  operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject,
): OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject | undefined {
  if (!operation.responses) return undefined;
  const successStatus = Object.keys(operation.responses).find((status) => /^2\d\d$/.test(status));
  if (!successStatus) return undefined;

  const response = operation.responses[successStatus] as OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject | undefined;
  if (!response?.content) return undefined;

  return pickFirstJsonSchema(response.content);
}

