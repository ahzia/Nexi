import { dereference } from "@readme/openapi-parser";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import YAML from "yaml";

import type { IngestionWarning, OpenAPIDocument } from "@/lib/types/tooling";

import type { IngestOpenApiOptions, LoadedDocument } from "./types";

export async function loadDocument(options: IngestOpenApiOptions): Promise<LoadedDocument> {
  const errors: IngestionWarning[] = [];

  if (!options.source && !options.document) {
    throw new Error("Either `source` or `document` must be provided when ingesting an OpenAPI specification.");
  }

  const initial = options.document ?? (options.source ? parseSource(options.source) : undefined);
  const dereferenced = (await dereference(initial as string | OpenAPIDocument)) as OpenAPIDocument;

  return { document: dereferenced, errors };
}

function parseSource(source: string): OpenAPIV3.Document | OpenAPIV3_1.Document | unknown {
  const trimmed = source.trim();
  if (!trimmed) throw new Error("Received empty OpenAPI source.");

  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  return YAML.parse(trimmed);
}

