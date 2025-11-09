import type { IngestedApiSpec } from "@/lib/types/tooling";

import { loadDocument } from "./document";
import { extractOperations, mapOperationToTool } from "./operations";
import type { IngestOpenApiOptions } from "./types";

export type { IngestOpenApiOptions } from "./types";

export async function ingestOpenApiSpec(options: IngestOpenApiOptions): Promise<IngestedApiSpec> {
  const { document, errors } = await loadDocument(options);
  const operations = extractOperations(document);
  const tools = operations.map((operation) => mapOperationToTool(operation, errors));

  return { document, tools, errors };
}

