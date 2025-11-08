## Nexi Hackathon Deployment Checklist

This guide walks through deploying the current Nexi MVP so judges (or demo partners) can ingest an OpenAPI spec, publish a blueprint, and hit a live MCP endpoint. Security hardening and long‑term ops are intentionally out of scope—focus on getting a functional demo online quickly.

---

### 1. Prerequisites
- Node.js 20+ and npm installed locally.
- Supabase project (free tier is fine). From the Supabase dashboard note:
  - Project URL (e.g. `https://abccompany.supabase.co`)
  - Service-role key (for server-to-server writes)
- Cloud hosting target for the Next.js app:
  - Vercel is recommended (one-click GitHub deploy, environment variable UI, built-in HTTPS).
  - Railway/Render/Fly.io also work; adjust instructions as needed.
- Public URL for the upstream API you plan to demo (or mock service). Ensure CORS is open or that you can deploy the API alongside Nexi.

---

### 2. Seed Supabase Tables
Run the SQL below in Supabase SQL Editor (Database → SQL) to create the tables used by the app:

```sql
-- Enable uuid helper
create extension if not exists "pgcrypto";

create or replace function public.sync_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.tool_blueprints (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  label text,
  raw_spec text,
  tools jsonb default '[]'::jsonb,
  warnings jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_tool_blueprints_updated_at on public.tool_blueprints;
create trigger trg_tool_blueprints_updated_at before update on public.tool_blueprints
for each row execute function public.sync_updated_at();

create table if not exists public.mcp_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  blueprint_id uuid references public.tool_blueprints(id),
  slug text not null unique,
  display_name text,
  base_url text not null,
  status text not null default 'active',
  api_key_hash text not null,
  capabilities jsonb not null,
  discovery_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_mcp_instances_updated_at on public.mcp_instances;
create trigger trg_mcp_instances_updated_at before update on public.mcp_instances
for each row execute function public.sync_updated_at();

create table if not exists public.tool_versions (
  id uuid primary key default gen_random_uuid(),
  mcp_instance_id uuid not null references public.mcp_instances(id) on delete cascade,
  name text not null,
  version text not null,
  schema jsonb not null,
  output_schema jsonb,
  description text,
  instructions text,
  metadata jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_tool_versions_instance_name
  on public.tool_versions (mcp_instance_id, name) where is_active;
```

> Optional (not used yet but recommended for credibility): also create `api_documents`, `credentials`, and `invocation_logs` per `docs/07_supabase_mcp_mapping.md`.

---

### 3. Environment Variables
Create `.env.production` (for local testing) and/or configure env vars in your hosting platform. Required keys:

```
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
DEFAULT_ORGANIZATION_ID="demo-org"

# Default base URL used when a spec omits servers[].url
NEXI_DEFAULT_BASE_URL="https://demo-api.example.com"

# Optional MCP base when generating publish endpoint links
MCP_BASE_URL="https://your-hosted-app.com/api"

# Upstream AI providers (not required for demo, but include if you show AI gap-filling)
OPENAI_API_KEY="sk-..."
OPENAI_MCP_API_KEY=""
OPENAI_ASSISTANT_ID=""
```

Notes:
- `DEFAULT_ORGANIZATION_ID` can stay `demo-org` for hackathon demos.
- `NEXI_DEFAULT_BASE_URL` matters if your OpenAPI spec doesn’t declare `servers`. Point this to the upstream REST API the MCP endpoint should call.
- If you deploy to Vercel, define these in “Project Settings → Environment Variables” and redeploy.

---

### 4. Build & Deploy the Next.js App

#### Local smoke test
```bash
cd Nexi
npm install
npm run dev
# Open http://localhost:3000
```
Ingest a sample spec, publish, and call the returned MCP endpoint with `curl` to confirm end-to-end behavior still works locally.

#### Deploy (Vercel example)
1. Push the repo to GitHub.
2. In Vercel:
   - “Add New Project” → import your GitHub repo.
   - Framework: Next.js (auto-detected).
   - Set the same env vars under “Environment Variables.”
   - Deploy.
3. After the first deployment, verify:
   - `/` loads and can ingest an OpenAPI sample.
   - API routes respond (`/api/openapi/ingest`, `/api/tool-blueprints`, `/api/mcp/publish`, `/api/mcp/{slug}`).

For other hosts:
- `npm run build` → `npm run start` to serve statically.
- Ensure your platform supports Node 20+ and persistent environment variables.

---

### 5. Demo Walkthrough

1. **Ingest spec:** On the deployed site, paste an OpenAPI spec with at least one GET/POST endpoint. Ensure it includes `servers[0].url` or that `NEXI_DEFAULT_BASE_URL` points to the API.
2. **Save & edit:** Save the blueprint, open its detail screen, tweak a tool’s metadata if needed.
3. **Publish:** Click “Publish MCP,” note the endpoint + API key in the success panel.
4. **Test MCP endpoint:**
   ```bash
   ENDPOINT="https://your-app.vercel.app/api/mcp/<slug>"
   API_KEY="...printed key..."

   # initialize
   curl -X POST "$ENDPOINT" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"0.1"}}}'

   # list tools
   curl -X POST "$ENDPOINT" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

   # call tool (replace tool name & args)
   curl -X POST "$ENDPOINT" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"searchAvailability","arguments":{"hotelId":"ABC","arrivalDate":"2025-12-17","departureDate":"2025-12-20"}}}'
   ```
   Confirm the response includes `content`/`structuredContent` from the upstream API.

5. **Optional AI client:** Configure a Custom GPT or Claude Desktop MCP entry using the endpoint + key. It should list the tools and call them live.

---

### 6. Troubleshooting Quick Notes
- **Missing base URL:** If publish succeeds but `tools/call` fails with “No base URL defined,” ensure the OpenAPI spec includes `servers[0].url` or set `NEXI_DEFAULT_BASE_URL`.
- **CORS/upstream auth:** For demos, prefer APIs that are either public or accept simple API key headers; otherwise set the header in the spec so the runtime includes it.
- **Supabase connection errors:** Double-check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; remember service role keys are long-lived and start with `eyJ...`.
- **Environment mismatch on Vercel:** After editing environment variables, redeploy or trigger redeploy in Vercel; the runtime reads env vars at build/boot time.

---

### 7. Nice-to-Have Demo Enhancements (Optional)
- Seed a sample blueprint (`tool_blueprints`) and published instance (`mcp_instances`, `tool_versions`) so the app opens with pre-built content.
- Add a `docs/demo_script.md` outlining your presentation script, expected agent prompts, and sample API outputs.
- Create a short Loom/Descript walkthrough hitting ingest → publish → `curl` call, handy if judges can’t run the demo live.

Ship it! With the above steps, you should have a fully-functional Nexi MVP ready for hackathon demos: ingest spec, edit blueprint, publish to MCP, and call the live endpoint from an AI agent. Good luck!

