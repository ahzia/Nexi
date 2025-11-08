import { XMLParser } from "fast-xml-parser";

interface TransformOptions {
  transformer?: string;
  contentType?: string;
  bodyText: string;
}

export interface TransformResult {
  structuredContent: unknown;
  additionalText?: string;
}

export function transformResponse({ transformer, contentType, bodyText }: TransformOptions): TransformResult {
  const normalizedTransformer = transformer ?? inferTransformer(contentType);

  switch (normalizedTransformer) {
    case "xml-to-json":
      return transformXmlToJson(bodyText);
    default:
      return {
        structuredContent: { raw: bodyText },
      };
  }
}

function inferTransformer(contentType?: string) {
  if (!contentType) return undefined;
  return contentType.includes("xml") ? "xml-to-json" : undefined;
}

function transformXmlToJson(bodyText: string): TransformResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
  });

  try {
    const parsed = parser.parse(bodyText);
    const rootKeys = typeof parsed === "object" && parsed ? Object.keys(parsed) : [];
    const summary = rootKeys.length ? `Converted XML response to JSON (root: ${rootKeys[0]}).` : undefined;
    return {
      structuredContent: {
        format: "xml-json",
        data: parsed,
        rawXml: bodyText,
      },
      additionalText: summary,
    };
  } catch (error) {
    return {
      structuredContent: {
        raw: bodyText,
        error: (error as Error).message,
      },
    };
  }
}
