import type { ToolMetadata, HttpParameter } from "./types";
import { serializeXmlBody } from "./xml";

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
}: {
  baseUrl: string;
  pathTemplate: string;
  method: string;
  args: Record<string, unknown>;
  httpMeta?: ToolMetadata["httpConfig"];
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
          schema: httpMeta.requestBody.xmlSchema,
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
