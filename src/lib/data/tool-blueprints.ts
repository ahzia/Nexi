import type { ToolDraft } from "@/lib/types/tooling";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const DEFAULT_ORGANIZATION_ID = process.env.DEFAULT_ORGANIZATION_ID ?? "demo-org";

export interface CreateToolBlueprintPayload {
  /**
   * Original OpenAPI source (JSON or YAML) submitted by the user.
   */
  source: string;
  /**
   * Draft tools generated from the ingestion pipeline.
   */
  tools: Array<Omit<ToolDraft, "rawOperation">>;
  /**
   * Optional label to help identify the blueprint later.
   */
  label?: string;
  /**
   * Optional warnings produced during ingestion.
   */
  warnings?: { id: string; level: string; message: string; operationId?: string }[];
}

export async function createToolBlueprint(payload: CreateToolBlueprintPayload) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("tool_blueprints")
    .insert({
      organization_id: DEFAULT_ORGANIZATION_ID,
      label: payload.label ?? "Untitled blueprint",
      raw_spec: payload.source,
      tools: payload.tools,
      warnings: payload.warnings ?? [],
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

