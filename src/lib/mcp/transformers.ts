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
  const trimmed = bodyText.trim();
  if (!trimmed) {
    return {
      structuredContent: {
        format: "xml-json",
        data: {},
        rawXml: bodyText,
      },
      additionalText: "Converted XML response to JSON (empty payload).",
    };
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
  });

  try {
    const parsed = parser.parse(bodyText);
    const { data, root } = pruneXmlDeclaration(parsed);
    const summary = root ? `Converted XML response to JSON (root: ${root}).` : "Converted XML response to JSON.";

    return {
      structuredContent: {
        format: "xml-json",
        data,
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

function pruneXmlDeclaration(parsed: unknown): { data: unknown; root?: string } {
  if (!parsed || typeof parsed !== "object") {
    return { data: parsed ?? {}, root: undefined };
  }

  const { ["?xml"]: _xmlDecl, ...rest } = parsed as Record<string, unknown>;
  const keys = Object.keys(rest);
  if (keys.length === 0) {
    return { data: {}, root: undefined };
  }

  const [root] = keys;
  return { data: rest, root };
}
