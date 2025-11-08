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

export interface ToolBlueprintSummary {
  id: string;
  label: string;
  created_at: string;
  tools: Array<{
    id: string;
    name: string;
    method: string;
    path: string;
    description: string;
    tags: string[];
  }>;
  warnings: CreateToolBlueprintPayload["warnings"];
}

export async function listToolBlueprints(limit = 10): Promise<ToolBlueprintSummary[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tool_blueprints")
    .select("id,label,created_at,tools,warnings")
    .eq("organization_id", DEFAULT_ORGANIZATION_ID)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    label: item.label ?? "Untitled blueprint",
    created_at: item.created_at,
    tools: item.tools ?? [],
    warnings: item.warnings ?? [],
  }));
}


export interface ToolBlueprintDetail extends ToolBlueprintSummary {
  raw_spec: string | null;
}

export async function getToolBlueprint(id: string): Promise<ToolBlueprintDetail | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tool_blueprints")
    .select("id,label,created_at,organization_id,raw_spec,tools,warnings")
    .eq("organization_id", DEFAULT_ORGANIZATION_ID)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    label: data.label ?? "Untitled blueprint",
    created_at: data.created_at,
    tools: data.tools ?? [],
    warnings: data.warnings ?? [],
    raw_spec: data.raw_spec ?? null,
  };
}
