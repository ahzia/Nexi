import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createToolBlueprint } from "@/lib/data/tool-blueprints";
import { ingestOpenApiSpec } from "@/lib/openapi";
import { ensureOpenApiSpec } from "@/lib/ai/openapi";

const PayloadSchema = z.object({
  source: z.string().min(1, "Input is required"),
});

export async function POST(req: NextRequest) {
  try {
    const { source } = PayloadSchema.parse(await req.json());

    let spec = source;
    let usedModel = false;
    let iterations = 0;
    let notes: string[] = [];

    let ingestion;
    try {
      ingestion = await ingestOpenApiSpec({ source: spec });
    } catch {
      const aiResult = await ensureOpenApiSpec(spec);
      spec = aiResult.spec;
      usedModel = aiResult.usedModel;
      iterations = aiResult.iterations;
      notes = aiResult.notes;
      ingestion = await ingestOpenApiSpec({ source: spec });
    }

    const infoTitle = ingestion.document.info?.title?.trim();
    const label = infoTitle || `Blueprint ${new Date().toLocaleString()}`;

    const warnings = ingestion.errors.map((warning) => ({
      id: warning.id,
      level: warning.level,
      message: warning.message,
      operationId: warning.operationId,
    }));

    if (usedModel) {
      warnings.push({
        id: "ai-assisted",
        level: "info",
        message: `Specification refined with OpenAI in ${iterations} iteration${iterations === 1 ? "" : "s"}.`,
        operationId: undefined,
      });
    }

    for (const note of notes) {
      warnings.push({
        id: `note-${Math.random().toString(36).slice(2)}`,
        level: "info",
        message: note,
        operationId: undefined,
      });
    }

    const blueprint = await createToolBlueprint({
      source: spec,
      label,
      tools: ingestion.tools.map(({ rawOperation: _rawOperation, ...rest }) => {
        void _rawOperation;
        return rest;
      }),
      warnings,
    });

    return NextResponse.json(
      {
        id: blueprint.id,
        usedModel,
        iterations,
        notes,
        toolCount: ingestion.tools.length,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 422 });
    }
    console.error("[blueprints.generate]", error);
    return NextResponse.json({ error: (error as Error).message ?? "Failed to generate blueprint" }, { status: 400 });
  }
}
