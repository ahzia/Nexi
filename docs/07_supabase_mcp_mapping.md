# Supabase Data Mapping for MCP Runtime

This document explains how Nexi persists MCP metadata and uses it to route incoming agent calls to customer-specific adapters. Treat it as the source of truth for database schemas, credential storage, and request/response correlation.

---

## 1. Core Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `organizations` | Tenant/brand grouping | `id`, `slug`, `billing_plan` |
| `mcp_instances` | One MCP endpoint per tenant (or per environment) | `id`, `organization_id`, `slug`, `display_name`, `base_url`, `api_key_hash`, `status`, `capabilities` (JSONB), `discovery_payload` (JSONB) |
| `tool_versions` | Published tool definitions | `id`, `mcp_instance_id`, `name`, `version`, `schema` (JSONB), `output_schema` (JSONB), `description`, `instructions`, `is_active` |
| `tool_blueprints` | Drafts from the canvas before publish | `id`, `organization_id`, `graph_state` (JSONB), `ai_notes`, `status` |
| `invocation_logs` | Historical tool calls | `id`, `mcp_instance_id`, `tool_name`, `request_payload` (JSONB), `response_payload` (JSONB), `status`, `latency_ms`, `agent_client` |
| `credentials` | External API secrets (CapCorn, etc.) | `id`, `organization_id`, `type`, `name`, `payload_encrypted`, `metadata` |
| `api_documents` | Uploaded customer docs | `id`, `organization_id`, `source_type`, `content`, `parsed_operations` (JSONB) |

> **Hashing & Encryption**  
> - `mcp_instances.api_key_hash` stores a one-way hash (bcrypt/argon2). Plain API keys are shown once at creation.  
> - `credentials.payload_encrypted` is sealed with Supabase Vault or client-side encryption before storage.

---

## 2. Handling Incoming `tools/call` Requests

1. **Auth & Lookup**
   - Extract API key from request header (default `Authorization: Bearer <token>`).
   - Compare against `api_key_hash` using constant-time verification.
   - Resolve the owning `mcp_instance` and `organization`.
2. **Tool Definition**
   - Lookup active `tool_versions` by `mcp_instance_id` + `name`.
   - Pull JSON schema, output schema, and execution metadata (`execution_mode`, `http_target`, etc.).
3. **Validation**
   - Validate incoming `arguments` with AJV using the stored schema.
   - Reject unknown fields unless tool config allows passthrough.
4. **Credential Resolution**
   - Fetch required external credentials from `credentials` table using tags in the tool metadata (e.g. `capcorn.default`).
   - Decrypt into memory only for the duration of the call.
5. **Execution**
   - Use the canvas-generated pipeline (stored alongside the schema) to map inputs → HTTP request → response transformation.
   - Timeout and retry strategies also live in tool metadata.
6. **Response Assembly**
   - Produce `content` (for human-readable summary) and optional `structuredContent`.
   - Flag `isError` if downstream errors occur.
7. **Logging**
   - Insert a row in `invocation_logs` with correlation ID, status, latency, truncated payloads, and agent client metadata (if available).

---

## 3. Matching Responses Back to Downstream Systems

- Each tool version can specify a `correlation_field` (e.g. booking reference). Store it in `invocation_logs.correlation_id`.
- For asynchronous pipelines (queued bookings):
  - Persist intermediate state in `invocation_jobs` table (`id`, `invocation_id`, `status`, `progress`).
  - Emit `notifications/progress` to the MCP client using correlation data.
- Attach `source_payload` in `response_payload.raw` when regulators require full traceability. Use Supabase storage for large payloads and store signed URLs.

---

## 4. Discovery & Capabilities Publishing

- During publish, generate:
  - `mcp_instances.capabilities` JSON (mirrors `initialize` response).
  - `mcp_instances.discovery_payload` used to render `/.well-known/mcp.json`.
- Publish job also:
  - Upserts tool definitions into cache (Redis) for low-latency lookup.
  - Invalidates CDN for discovery file.

---

## 5. Audit & Compliance

- **RLS Policies**: Every table above must restrict access to `organization_id`. Admin dashboards call Supabase using service role but scope by tenant.
- **Change History**: Track schema changes via `tool_versions.version` + created timestamps. Maintain migration history in `tool_version_history` (optional) for SOC/SOX audit.
- **Sensitive fields** (`payload_encrypted`, raw request/response data) should be excluded from analytics replicas.
- **API key rotation**: Provide UI & API for generating new API keys. Upon rotation, old hashes move to `mcp_instance_api_keys` with expiry to honor active sessions.

---

## 6. Open Tasks

1. **Finalize schema migration scripts** (`supabase/migrations/*.sql`) for the tables above.
2. **Implement hashed key verification helper** in the API service.
3. **Add RLS tests** covering each table to prevent cross-tenant access.
4. **Build archival job** to move `invocation_logs` older than 90 days to cold storage while keeping aggregates.

