import { NextResponse } from "next/server";

export interface JsonRpcSuccess<T = unknown> {
  jsonrpc: "2.0";
  id: string | number | null;
  result: T;
}

export interface JsonRpcError {
  jsonrpc: "2.0";
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type JsonRpcResponse<T = unknown> = JsonRpcSuccess<T> | JsonRpcError;

export function jsonRpcResponse<T>(payload: JsonRpcResponse<T>, status = 200) {
  return addCorsHeaders(NextResponse.json(payload, { status }));
}

export function addCorsHeaders<T extends Response>(response: T): T {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, MCP-Proxy-Auth-Token",
  );
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Credentials", "false");
  return response;
}

export function emptyCorsResponse(status = 200) {
  return addCorsHeaders(new NextResponse(null, { status }));
}

export function makeResult<T>(id: string | number | null, result: T): JsonRpcSuccess<T> {
  return { jsonrpc: "2.0", id, result };
}

export function makeError(id: string | number | null, code: number, message: string, data?: unknown): JsonRpcError {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  };
}

export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;
