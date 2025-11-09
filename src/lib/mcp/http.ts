import { XMLBuilder } from "fast-xml-parser";

import type { ToolMetadata, HttpParameter } from "./types";

export interface HttpRequestConfig {
  url: string;
  headers: Headers;
  body?: string;
}

export function buildHttpRequest({
  baseUrl,
  pathTemplate,
  method,
  args,
  httpMeta,
  inputSchema,
}: {
  baseUrl: string;
  pathTemplate: string;
  method: string;
  args: Record<string, unknown>;
  httpMeta?: ToolMetadata["httpConfig"];
  inputSchema?: unknown;
}): HttpRequestConfig {
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
    if (bodyValue !== undefined && bodyValue !== null) {
      const contentType = httpMeta.requestBody.contentType ?? "application/json";
      headers.set("Content-Type", contentType);
      if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
        body = serializeXmlBody({
          value: bodyValue,
          schema: resolveBodySchema(inputSchema, httpMeta.requestBody.propertyName),
          rootName: httpMeta.requestBody.xmlRoot ?? httpMeta.requestBody.propertyName,
        });
      } else {
        body = typeof bodyValue === "string" ? bodyValue : JSON.stringify(bodyValue);
      }
    }
  }

  if (method === "GET" || method === "HEAD") {
    body = undefined;
  }

  return { url: url.toString(), headers, body };
}

export function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

function replacePathParams(
  template: string,
  args: Record<string, unknown>,
  parameters?: HttpParameter[],
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

function resolveBodySchema(inputSchema: unknown, propertyName: string) {
  if (!inputSchema || typeof inputSchema !== "object") return undefined;
  const schemaObject = inputSchema as { properties?: Record<string, unknown> };
  const properties = schemaObject.properties;
  if (!properties || typeof properties !== "object") return undefined;
  return (properties as Record<string, unknown>)[propertyName];
}

function serializeXmlBody({
  value,
  schema,
  rootName,
}: {
  value: unknown;
  schema: unknown;
  rootName: string;
}): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value !== "object" || value === null) {
    throw new Error("XML request bodies must be provided as a string or JSON object.");
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
  });

  const xmlSchema = normalizeSchema(schema);
  const rootElementName = xmlSchema?.xml?.name ?? rootName;
  const prepared = {
    [rootElementName]: prepareXmlValue(value, xmlSchema),
  };

  return builder.build(prepared);
}

interface XmlSchema {
  xml?: {
    name?: string;
    attribute?: boolean;
    wrapped?: boolean;
  };
  type?: string | string[];
  properties?: Record<string, XmlSchema>;
  items?: XmlSchema | XmlSchema[];
  additionalProperties?: boolean | XmlSchema;
}

function normalizeSchema(schema: unknown): XmlSchema | undefined {
  if (!schema || typeof schema !== "object") return undefined;
  const normalized = schema as XmlSchema;
  const items = normalized.items;
  if (Array.isArray(items)) {
    normalized.items = items[0];
  }
  return normalized;
}

function prepareXmlValue(value: unknown, schema?: XmlSchema): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const itemSchema = normalizeSchema(schema?.items);
    return value.map((item) => prepareXmlValue(item, itemSchema));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    const objectValue = value as Record<string, unknown>;
    const properties = schema?.properties ?? {};

    for (const [key, childValue] of Object.entries(objectValue)) {
      if (childValue === undefined || childValue === null) continue;
      const childSchema = normalizeSchema(properties[key]);
      const xmlMeta = childSchema?.xml;

      if (xmlMeta?.attribute) {
        const attributeName = xmlMeta.name ?? key;
        result[`@_${attributeName}`] = childValue;
      } else {
        const elementName = xmlMeta?.name ?? key;
        result[elementName] = prepareXmlValue(childValue, childSchema);
      }
    }

    return result;
  }

  return value;
}
