type EnvValue = string | undefined;

function readEnv(name: string): EnvValue {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

function coalesce<T>(...values: Array<T | undefined>): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  organizationId: readEnv("DEFAULT_ORGANIZATION_ID") ?? "demo-org",
  mcp: {
    baseUrl: coalesce(readEnv("MCP_BASE_URL"), readEnv("NEXT_PUBLIC_MCP_BASE_URL")),
    runtimeBaseUrl: readEnv("NEXI_DEFAULT_BASE_URL"),
    protocolVersion: readEnv("NEXI_MCP_PROTOCOL_VERSION"),
    serverVersion: readEnv("NEXT_PUBLIC_NEXI_VERSION") ?? "0.1.0",
  },
  openai: {
    apiKey: readEnv("OPENAI_API_KEY"),
    model: readEnv("OPENAI_MCP_MODEL")?.trim() || "gpt-4.1-mini",
  },
  supabase: {
    url: coalesce(readEnv("SUPABASE_URL"), readEnv("NEXT_PUBLIC_SUPABASE_URL")),
    serviceRoleKey: coalesce(readEnv("SUPABASE_SERVICE_ROLE_KEY"), readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
  },
};

export function resolveMcpBaseUrl(override?: string): string {
  const value = override ?? config.mcp.baseUrl ?? "http://localhost:8787";
  return value.replace(/\/$/, "");
}


