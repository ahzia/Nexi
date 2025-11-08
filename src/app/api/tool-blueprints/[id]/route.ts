import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getToolBlueprint, updateToolBlueprint } from "@/lib/data/tool-blueprints";

const PatchSchema = z.object({
  label: z.string().optional(),
  tools: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        summary: z.string().optional(),
        method: z.string(),
        path: z.string(),
        tags: z.array(z.string()),
        inputSchema: z.unknown(),
        outputSchema: z.unknown().optional(),
        security: z.array(z.record(z.string(), z.any())).optional(),
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
  const blueprint = await getToolBlueprint(id);
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

    const result = await updateToolBlueprint({
      id,
      label: payload.label,
      tools: payload.tools,
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
