import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

export type HttpMethod =
  | 'get'
  | 'put'
  | 'post'
  | 'delete'
  | 'options'
  | 'head'
  | 'patch'
  | 'trace';

export interface ToolDraft {
  /** Unique identifier derived from operationId or method+path */
  id: string;
  /** Human-friendly name shown in the canvas */
  name: string;
  /** External identifier for linking to storage (e.g., Supabase row id) */
  blueprintId?: string;
  /** Description leveraged by MCP clients */
  description: string;
  /** Optional short summary from OpenAPI spec */
  summary?: string;
  /** HTTP method of the originating endpoint */
  method: HttpMethod;
  /** API path for the endpoint */
  path: string;
  /** Tags / categories inherited from OpenAPI */
  tags: string[];
  /** JSON schema representing combined parameters and request body */
  inputSchema: unknown;
  /** JSON schema representing the primary success response */
  outputSchema?: unknown;
  /** Security requirements found on the operation */
  security?: OpenAPIV3.SecurityRequirementObject[];
  /** HTTP metadata used by the runtime executor */
  httpConfig?: {
    baseUrl?: string;
    parameters: Array<{
      name: string;
      in: 'query' | 'path' | 'header';
      required: boolean;
    }>;
    requestBody?: {
      propertyName: string;
      contentType?: string;
      required: boolean;
      xmlRoot?: string;
    };
    responseContentType?: string;
    responseTransformer?: string;
  };
  /** Raw OpenAPI operation for future advanced editing */
  rawOperation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
}

export interface IngestedApiSpec {
  document: OpenAPIDocument;
  tools: ToolDraft[];
  errors: IngestionWarning[];
}

export interface IngestionWarning {
  id: string;
  level: 'info' | 'warning';
  message: string;
  operationId?: string;
}

