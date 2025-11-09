import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createBlueprint, listBlueprintSummaries } from "@/lib/services/blueprints";
import type { ToolDraft } from "@/lib/types/tooling";

const PayloadSchema = z.object({
  source: z.string().min(1, "OpenAPI source is required."),
  tools: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        summary: z.string().optional(),
        method: z.enum(["get", "put", "post", "delete", "options", "head", "patch", "trace"]),
        path: z.string(),
        tags: z.array(z.string()),
        inputSchema: z.unknown(),
        outputSchema: z.unknown().optional(),
        security: z.array(z.record(z.string(), z.any())).optional(),
        httpConfig: z
          .object({
            baseUrl: z.string().optional(),
            parameters: z
              .array(
                z.object({
                  name: z.string(),
                  in: z.enum(["query", "path", "header"]),
                  required: z.boolean(),
                }),
              )
              .optional(),
            requestBody: z
              .object({
                propertyName: z.string(),
                contentType: z.string().optional(),
                required: z.boolean(),
              })
              .optional(),
            responseContentType: z.string().optional(),
          })
          .optional(),
      }),
    )
    .min(1, "At least one tool is required."),
  label: z.string().optional(),
  warnings: z
    .array(
      z.object({
        id: z.string(),
        level: z.enum(["info", "warning"]),
        message: z.string(),
        operationId: z.string().optional(),
      }),
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = PayloadSchema.parse(json);

    const normalizedTools = payload.tools.map(
      (tool) =>
        ({
          ...tool,
          httpConfig: tool.httpConfig
            ? {
                ...tool.httpConfig,
                parameters: tool.httpConfig.parameters ?? [],
              }
            : undefined,
        }) as Omit<ToolDraft, "rawOperation">,
    );

    const result = await createBlueprint({
      ...payload,
      tools: normalizedTools,
    });

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    console.error("[tool-blueprints] failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 422 });
    }
    return NextResponse.json({ error: (error as Error).message ?? "Failed to save tool blueprint" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const data = await listBlueprintSummaries(20);
    return NextResponse.json({ items: data }, { status: 200 });
  } catch (error) {
    console.error("[tool-blueprints] list failed", error);
    return NextResponse.json({ error: (error as Error).message ?? "Failed to fetch tool blueprints" }, { status: 400 });
  }
}

