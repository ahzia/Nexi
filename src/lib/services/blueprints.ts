import { ensureOpenApiSpec } from "@/lib/ai/openapi";
import { createToolBlueprint, deleteToolBlueprint, getToolBlueprint, listToolBlueprints, updateToolBlueprint } from "@/lib/data/tool-blueprints";
import { ingestOpenApiSpec } from "@/lib/openapi/ingest";
import type { CreateToolBlueprintPayload, UpdateToolBlueprintPayload } from "@/lib/data/tool-blueprints";
import type { IngestedApiSpec, IngestionWarning } from "@/lib/types/tooling";

export interface BlueprintGenerationResult {
  id: string;
  usedModel: boolean;
  iterations: number;
  notes: string[];
  toolCount: number;
}

export async function generateBlueprintFromSource(source: string): Promise<BlueprintGenerationResult> {
  let spec = source;
  let usedModel = false;
  let iterations = 0;
  let notes: string[] = [];

  let ingestion: IngestedApiSpec;
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

  const warnings = buildWarnings(ingestion, notes, usedModel, iterations);
  const infoTitle = ingestion.document.info?.title?.trim();
  const label = infoTitle || `Blueprint ${new Date().toLocaleString()}`;

  const blueprint = await createToolBlueprint({
    source: spec,
    label,
    tools: ingestion.tools.map(({ rawOperation: _unused, ...rest }) => rest),
    warnings,
  });

  return {
    id: blueprint.id,
    usedModel,
    iterations,
    notes,
    toolCount: ingestion.tools.length,
  };
}

export async function createBlueprint(payload: CreateToolBlueprintPayload) {
  return createToolBlueprint(payload);
}

export async function listBlueprintSummaries(limit = 20) {
  return listToolBlueprints(limit);
}

export async function getBlueprint(id: string) {
  return getToolBlueprint(id);
}

export async function updateBlueprint(payload: UpdateToolBlueprintPayload) {
  return updateToolBlueprint(payload);
}

export async function removeBlueprint(id: string) {
  return deleteToolBlueprint(id);
}

function buildWarnings(
  ingestion: IngestedApiSpec,
  notes: string[],
  usedModel: boolean,
  iterations: number,
): IngestionWarning[] {
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

  return warnings;
}

