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
  tools: Array<
    Omit<ToolDraft, "rawOperation">
  >;
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
  instances: PublishedMcpInstance[];
}

export interface PublishedMcpInstance {
  id: string;
  slug: string;
  displayName: string | null;
  baseUrl: string;
  status: string;
  requiresKey: boolean;
  capabilities: unknown;
  discovery: unknown;
  createdAt: string;
  updatedAt: string;
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

  const { data: instancesData, error: instancesError } = await supabase
    .from("mcp_instances")
    .select(
      "id, slug, display_name, base_url, status, api_key_hash, capabilities, discovery_payload, created_at, updated_at",
    )
    .eq("organization_id", DEFAULT_ORGANIZATION_ID)
    .eq("blueprint_id", id)
    .order("created_at", { ascending: false });

  if (instancesError) {
    throw instancesError;
  }

  const instances: PublishedMcpInstance[] = (instancesData ?? []).map((instance) => ({
    id: instance.id,
    slug: instance.slug,
    displayName: instance.display_name ?? null,
    baseUrl: instance.base_url,
    status: instance.status ?? "unknown",
    requiresKey: Boolean(instance.api_key_hash),
    capabilities: instance.capabilities ?? null,
    discovery: instance.discovery_payload ?? null,
    createdAt: instance.created_at,
    updatedAt: instance.updated_at,
  }));

  return {
    id: data.id,
    label: data.label ?? "Untitled blueprint",
    created_at: data.created_at,
    tools: data.tools ?? [],
    warnings: data.warnings ?? [],
    raw_spec: data.raw_spec ?? null,
    instances,
  };
}

export interface UpdateToolBlueprintPayload {
  id: string;
  label?: string;
  tools?: Array<Omit<ToolDraft, "rawOperation">>;
  warnings?: CreateToolBlueprintPayload["warnings"];
}

export async function updateToolBlueprint(payload: UpdateToolBlueprintPayload) {
  const supabase = getSupabaseAdminClient();
  const updateBody: Record<string, unknown> = {};

  if (payload.label !== undefined) {
    updateBody.label = payload.label;
  }
  if (payload.tools !== undefined) {
    updateBody.tools = payload.tools;
  }
  if (payload.warnings !== undefined) {
    updateBody.warnings = payload.warnings;
  }

  if (Object.keys(updateBody).length === 0) {
    return { id: payload.id };
  }

  const { data, error } = await supabase
    .from("tool_blueprints")
    .update({
      ...updateBody,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", DEFAULT_ORGANIZATION_ID)
    .eq("id", payload.id)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
export async function deleteToolBlueprint(id: string) {
  const supabase = getSupabaseAdminClient();

  const { data: instances, error: instancesError } = await supabase
    .from("mcp_instances")
    .select("id")
    .eq("organization_id", DEFAULT_ORGANIZATION_ID)
    .eq("blueprint_id", id);

  if (instancesError) {
    throw instancesError;
  }

  const instanceIds = (instances ?? []).map((instance) => instance.id);

  if (instanceIds.length > 0) {
    const { error: toolDeleteError } = await supabase
      .from("tool_versions")
      .delete()
      .in("mcp_instance_id", instanceIds);
    if (toolDeleteError) {
      throw toolDeleteError;
    }

    const { error: instanceDeleteError } = await supabase
      .from("mcp_instances")
      .delete()
      .eq("organization_id", DEFAULT_ORGANIZATION_ID)
      .eq("blueprint_id", id);
    if (instanceDeleteError) {
      throw instanceDeleteError;
    }
  }

  const { error } = await supabase
    .from("tool_blueprints")
    .delete()
    .eq("organization_id", DEFAULT_ORGANIZATION_ID)
    .eq("id", id);
  if (error) {
    throw error;
  }
}
