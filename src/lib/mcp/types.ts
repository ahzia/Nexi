export interface HttpParameter {
  name: string;
  in: "query" | "path" | "header";
  required: boolean;
}

export interface ToolMetadata {
  method?: string;
  path?: string;
  httpConfig?: {
    baseUrl?: string;
    parameters?: HttpParameter[];
    requestBody?: {
      propertyName: string;
      contentType?: string;
      required: boolean;
      xmlRoot?: string;
    };
    responseContentType?: string;
    responseTransformer?: string;
  } | null;
}

export interface RuntimeTool {
  name: string;
  description: string | null;
  instructions: string | null;
  metadata: ToolMetadata | null;
}

export interface ExecutionResult {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: unknown;
  isError: boolean;
}
