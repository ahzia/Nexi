import OpenAI from "openai";

import { config } from "@/lib/config";

export interface EnsureOpenApiResult {
  spec: string;
  iterations: number;
  usedModel: boolean;
  notes: string[];
}

const MODEL = config.openai.model;
const MAX_ATTEMPTS = 3;

export async function ensureOpenApiSpec(rawInput: string): Promise<EnsureOpenApiResult> {
  let current = rawInput;
  const notes: string[] = [];
  let iterations = 0;
  let usedModel = false;

  while (iterations < MAX_ATTEMPTS) {
    iterations += 1;
    try {
      validateLikelyOpenApi(current);
      return { spec: current, iterations, usedModel, notes };
    } catch (error) {
      notes.push(`Validation attempt ${iterations} failed: ${(error as Error).message}`);
    }

    const apiKey = config.openai.apiKey;
    if (!apiKey) {
      break;
    }

    usedModel = true;
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content:
            "You are an expert API architect. Convert any description or partial schema into a fully valid OpenAPI 3.0 JSON document. Return ONLY formatted JSON — no markdown, no commentary. Ensure the document contains info, servers, and paths definitions that align with the provided description. Prefer HTTPS URLs. Include accurate request/response schemas whenever possible.",
        },
        {
          role: "user",
          content: `Provided API description:\n${current}\n\nIf issues were reported, address them: ${notes[notes.length - 1] ?? ""}`,
        },
      ],
      temperature: 0.2,
    });

    const output = response.output_text ?? "";
    const extracted = extractJsonBlock(output.trim());
    current = extracted;
  }

  throw new Error(notes.at(-1) ?? "Unable to produce a valid OpenAPI specification.");
}

function validateLikelyOpenApi(source: string) {
  const trimmed = source.trim();
  if (!trimmed) {
    throw new Error("Empty specification");
  }
  const parsed = JSON.parse(trimmed);
  if (!(parsed && typeof parsed === "object")) {
    throw new Error("Specification must be a JSON object");
  }
  if (!("openapi" in parsed) && !("swagger" in parsed)) {
    throw new Error("Missing 'openapi' field");
  }
  if (!parsed.paths) {
    throw new Error("Missing 'paths' field");
  }
}

function extractJsonBlock(raw: string) {
  if (!raw) return raw;
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return raw;
  }
  const candidate = raw.slice(firstBrace, lastBrace + 1);
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return raw;
  }
}
