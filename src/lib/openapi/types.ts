import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

import type { HttpMethod, OpenAPIDocument } from "@/lib/types/tooling";
import type { IngestionWarning } from "@/lib/types/tooling";

export interface IngestOpenApiOptions {
  source?: string;
  document?: unknown;
  sourceName?: string;
}

export interface OperationWithPath {
  document: OpenAPIDocument;
  method: HttpMethod;
  path: string;
  operation: OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
}

export interface LoadedDocument {
  document: OpenAPIDocument;
  errors: IngestionWarning[];
}

