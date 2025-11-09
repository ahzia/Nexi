import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getBlueprint, updateBlueprint, removeBlueprint } from "@/lib/services/blueprints";
import type { ToolDraft } from "@/lib/types/tooling";

const PatchSchema = z.object({
  label: z.string().optional(),
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
            responseTransformer: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blueprint = await getBlueprint(id);
  if (!blueprint) {
    return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
  }
  return NextResponse.json({ blueprint });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await req.json();
    const payload = PatchSchema.parse(json);

    const normalizedTools = payload.tools
      ? (payload.tools.map((tool) => ({
          ...tool,
          inputSchema: tool.inputSchema ?? {},
          httpConfig: tool.httpConfig
            ? {
                ...tool.httpConfig,
                parameters: tool.httpConfig.parameters ?? [],
              }
            : undefined,
        })) satisfies Array<Omit<ToolDraft, "rawOperation">>)
      : undefined;

    const result = await updateBlueprint({
      id,
      label: payload.label,
      tools: normalizedTools,
      warnings: payload.warnings,
    });

    return NextResponse.json({ id: result.id }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 422 });
    }
    console.error("[tool-blueprints.patch]", error);
    return NextResponse.json({ error: (error as Error).message ?? "Failed to update blueprint" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await removeBlueprint(id);
    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    console.error("[tool-blueprints.delete]", error);
    return NextResponse.json({ error: (error as Error).message ?? "Failed to delete blueprint" }, { status: 400 });
  }
}
