import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

import type { HttpMethod, IngestionWarning } from "@/lib/types/tooling";

type JsonSchema = Record<string, unknown>;

export interface HttpConfigResult {
  parameters: Array<{ name: string; in: "query" | "path" | "header"; required: boolean }>;
  requestBody?: { propertyName: string; contentType?: string; required: boolean; xmlRoot?: string; xmlSchema?: unknown };
}

export interface InputSchemaResult {
  inputSchema: unknown;
  schemaWarnings: IngestionWarning[];
  httpConfig: HttpConfigResult;
}

export function buildInputSchema(
  operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject,
  method: HttpMethod,
  path: string,
): InputSchemaResult {
  const schemaWarnings: IngestionWarning[] = [];
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  const httpParameters: Array<{ name: string; in: "query" | "path" | "header"; required: boolean }> = [];
  let requestBodyConfig:
    | { propertyName: string; contentType?: string; required: boolean; xmlRoot?: string; xmlSchema?: unknown }
    | undefined;

  const parameters: (OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject)[] = Array.isArray(operation.parameters)
    ? (operation.parameters as (OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject)[])
    : [];

  for (const parameter of parameters) {
    const name = parameter.name;
    const schema = (parameter.schema ?? { type: "string" }) as JsonSchema;
    properties[name] = {
      ...schema,
      in: (parameter as OpenAPIV3.ParameterObject).in,
      description: parameter.description,
      example: (parameter as OpenAPIV3.ParameterObject).example,
    };
    const location = (parameter as OpenAPIV3.ParameterObject).in;
    if (location === "query" || location === "path" || location === "header") {
      httpParameters.push({
        name,
        in: location,
        required: Boolean(parameter.required),
      });
    }
    if (parameter.required) {
      required.push(name);
    }
  }

  const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject | undefined;
  if (requestBody?.content) {
    const bodySelection = pickPreferredMediaType(requestBody.content);
    const bodySchema = bodySelection?.schema;
    if (bodySchema) {
      const sanitizedBodySchema = stripXmlAnnotations(bodySchema);
      const bodyPropertyName = resolveBodyProperty(properties);
      properties[bodyPropertyName] = {
        ...((sanitizedBodySchema as JsonSchema) ?? {}),
        description: requestBody.description ?? "Request payload.",
      };
      if (requestBody.required) {
        required.push(bodyPropertyName);
      }
      requestBodyConfig = {
        propertyName: bodyPropertyName,
        contentType: bodySelection?.mediaType,
        required: Boolean(requestBody.required),
        xmlRoot: bodySelection?.mediaType?.includes("xml")
          ? (bodySchema as { xml?: { name?: string } })?.xml?.name ?? bodyPropertyName
          : undefined,
        xmlSchema: bodySchema,
      };
    } else {
      schemaWarnings.push({
        id: `missing-request-body-schema-${method}-${path}`,
        level: "warning",
        message: "Could not determine request body schema for operation.",
        operationId: operation.operationId,
      });
    }
  }

  return {
    inputSchema: {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false,
    },
    schemaWarnings,
    httpConfig: {
      parameters: httpParameters,
      requestBody: requestBodyConfig,
    },
  };
}

export function buildOutputSchema(
  operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject,
): { schema?: OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject; contentType?: string } {
  if (!operation.responses) return {};
  const successStatus = Object.keys(operation.responses).find((status) => /^2\d\d$/.test(status));
  if (!successStatus) return {};

  const response = operation.responses[successStatus] as OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject | undefined;
  if (!response?.content) return {};

  const selected = pickPreferredMediaType(response.content);
  return {
    schema: selected?.schema,
    contentType: selected?.mediaType,
  };
}

function resolveBodyProperty(existing: Record<string, unknown>): string {
  if (!("body" in existing)) {
    return "body";
  }
  let index = 1;
  while (`body${index}` in existing) {
    index += 1;
  }
  return `body${index}`;
}

export function stripXmlAnnotations(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map((item) => stripXmlAnnotations(item));
  }
  if (!schema || typeof schema !== "object") {
    return schema;
  }

  const entries = Object.entries(schema as Record<string, unknown>);
  const result: Record<string, unknown> = {};

  for (const [key, value] of entries) {
    if (key === "xml") {
      continue;
    }
    if (key === "properties" && value && typeof value === "object" && !Array.isArray(value)) {
      const sanitizedProps: Record<string, unknown> = {};
      for (const [propKey, propValue] of Object.entries(value as Record<string, unknown>)) {
        sanitizedProps[propKey] = stripXmlAnnotations(propValue);
      }
      result[key] = sanitizedProps;
      continue;
    }
    if (key === "items") {
      result[key] = stripXmlAnnotations(value);
      continue;
    }
    if (Array.isArray(value)) {
      result[key] = value.map((item) => stripXmlAnnotations(item));
      continue;
    }
    if (value && typeof value === "object") {
      result[key] = stripXmlAnnotations(value);
      continue;
    }
    result[key] = value;
  }

  return result;
}

function pickPreferredMediaType(
  content: Record<string, OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject>,
): { schema?: OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject; mediaType: string } | undefined {
  const entries = Object.entries(content);
  if (entries.length === 0) return undefined;

  const jsonEntry = entries.find(([type]) => type.includes("json"));
  const [mediaType, target] = jsonEntry ?? entries[0];

  return {
    mediaType,
    schema: target.schema as OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject | undefined,
  };
}

