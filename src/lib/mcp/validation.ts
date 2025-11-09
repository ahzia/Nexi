import type { ToolMetadata } from "./types";

export class ValidationError extends Error {
  constructor(message: string, public readonly details?: string[]) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateToolArguments(metadata: ToolMetadata | null, args: Record<string, unknown>) {
  const httpMeta = metadata?.httpConfig;
  const errors: string[] = [];

  if (httpMeta?.parameters) {
    for (const param of httpMeta.parameters) {
      if (!param.required) continue;
      const value = args[param.name];
      if (value === undefined || value === null || value === "") {
        errors.push(`Missing required ${param.in} parameter "${param.name}".`);
      } else if (typeof value === "object" && !Array.isArray(value)) {
        errors.push(`Parameter "${param.name}" must be a primitive value.`);
      }
    }
  }

  if (httpMeta?.requestBody?.required) {
    const payload = args[httpMeta.requestBody.propertyName];
    if (payload === undefined || payload === null || payload === "") {
      errors.push(`Missing required request body field "${httpMeta.requestBody.propertyName}".`);
    } else if (httpMeta.requestBody.contentType?.includes("xml")) {
      const isString = typeof payload === "string";
      const isObject = typeof payload === "object" && payload !== null;
      if (!isString && !isObject) {
        errors.push(
          `Field "${httpMeta.requestBody.propertyName}" must be provided as XML (string) or JSON object (content-type ${httpMeta.requestBody.contentType}).`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError("Invalid arguments", errors);
  }
}
