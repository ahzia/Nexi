import { XMLBuilder } from "fast-xml-parser";

interface SerializeXmlOptions {
  value: unknown;
  schema?: unknown;
  rootName: string;
}

interface XmlSchema {
  xml?: {
    name?: string;
    attribute?: boolean;
    wrapped?: boolean;
  };
  type?: string | string[];
  properties?: Record<string, XmlSchema>;
  items?: XmlSchema | XmlSchema[];
  additionalProperties?: boolean | XmlSchema;
  xmlAttributes?: Record<string, unknown>;
}

export function serializeXmlBody({ value, schema, rootName }: SerializeXmlOptions): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    throw new Error("XML request bodies must not be null or undefined.");
  }
  if (typeof value !== "object") {
    throw new Error("XML request bodies must be provided as a string or JSON object.");
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
  });

  const xmlSchema = normalizeSchema(schema);
  const effectiveRoot = xmlSchema?.xml?.name ?? rootName;
  const prepared = {
    [effectiveRoot]: prepareXmlValue(value, xmlSchema),
  };

  return builder.build(prepared);
}

function normalizeSchema(schema: unknown): XmlSchema | undefined {
  if (!schema || typeof schema !== "object") return undefined;
  const normalized = schema as XmlSchema;
  const items = normalized.items;
  if (Array.isArray(items)) {
    normalized.items = items[0];
  }
  return normalized;
}

function prepareXmlValue(value: unknown, schema?: XmlSchema): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const itemSchema = normalizeSchema(schema?.items);
    return value.map((item) => prepareXmlValue(item, itemSchema));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    const objectValue = value as Record<string, unknown>;
    const properties = schema?.properties ?? {};

    for (const [key, childValue] of Object.entries(objectValue)) {
      if (childValue === undefined || childValue === null) continue;
      const childSchema = normalizeSchema(properties[key]);
      const xmlMeta = childSchema?.xml;

      if (xmlMeta?.attribute) {
        const attributeName = xmlMeta.name ?? key;
        result[`@_${attributeName}`] = childValue;
      } else {
        const elementName = xmlMeta?.name ?? key;
        result[elementName] = prepareXmlValue(childValue, childSchema);
      }
    }

    const attributes = schema?.xmlAttributes ?? {};
    for (const [attributeName, attributeValue] of Object.entries(attributes)) {
      const key = `@_${attributeName}`;
      if (result[key] === undefined) {
        result[key] = attributeValue;
      }
    }

    return result;
  }

  return value;
}
