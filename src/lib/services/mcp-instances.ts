import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface McpInstanceRecord {
  id: string;
  slug: string;
  displayName: string | null;
  baseUrl: string;
  status: string;
  requiresKey: boolean;
}

export async function getMcpInstanceBySlug(slug: string): Promise<McpInstanceRecord | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("mcp_instances")
    .select("id, slug, display_name, base_url, status, api_key_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    slug: data.slug,
    displayName: data.display_name ?? null,
    baseUrl: data.base_url,
    status: data.status ?? "unknown",
    requiresKey: Boolean(data.api_key_hash),
  };
}

