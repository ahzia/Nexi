# Nexi MCP Builder – System Architecture

## Vision

Enable hotel groups and other service providers to expose their existing APIs as trustworthy MCP-compatible tools that AI agents can invoke autonomously. The web app guides non-technical stakeholders from raw documentation to a hosted MCP endpoint backed by Supabase persistence and an AI-assisted configuration workflow.

## Experience Pillars

- **Guided Intake:** Upload or paste structured docs (`xml`, `json`, `yaml`, `markdown`). The system parses key entities, endpoints, payload schemas, and credentials.
- **AI-Assisted Mapping:** Combine documentation snippets with curated prompts to draft tool definitions, parameter schemas, and sample requests.
- **Visual Tool Builder:** Canvas-style interface for composing tool pipelines, mirroring the interaction patterns of our proven workflow UI (drag blocks, inspect schemas, inline validation).
- **Hosted MCP Adapter:** Generate and deploy tenant-specific MCP endpoints (`/tools`, `/call`) secured with API keys, observable via dashboards and logs.
- **Operational Feedback:** Provide test consoles, invocation history, and troubleshooting helpers to build trust in autonomous bookings.

## High-Level System Overview

```
┌──────────────────────────────┐
│          Web Client          │
│  (Next.js / React, Canvas)   │
└──────────────┬───────────────┘
               │ GraphQL/REST
┌──────────────▼───────────────┐
│        Application API        │
│  (Next.js API Routes / Nest)  │
├──────────────┬───────────────┤
│  AI Orchestrator  │ MCP Core │
│  (OpenAI client)  │ Services │
└──────────────┬───────────────┘
               │
      ┌────────▼────────┐
      │    Supabase     │
      │ (Auth + DB +    │
      │  Edge Functions)│
      └────────┬────────┘
               │
      ┌────────▼────────┐
      │ Client Backends │
      │ (CapCorn, etc.) │
      └─────────────────┘
```

## Frontend Architecture

- **Framework:** Next.js 15 App Router with React, leveraging server actions for Supabase integration and streaming AI responses.
- **State:** Zustand (client state) + React Query/TanStack Query for server data.
- **Reusable UI Primitives:** Port the design system, typography, and component patterns from the workflow builder project. Key carries: floating panels, themed surfaces, drag-to-connect nodes, schema inspectors, toast/notification pattern.
- **Feature Modules:**
  - `Documentation Intake`: Uploads, parser status, manual field tagging.
  - `Schema Studio`: Renders detected endpoints, parameters, sample payloads.
  - `Prompt Studio`: Prepares composite prompts (documentation excerpt + task template + guardrails); shows AI streaming output with diff review to approve.
  - `Tool Canvas`: Drag nodes for `Input`, `Transform`, `Invocation`, `Response Mapping`. Each node uses forms derived from JSON schema definitions, matching the ergonomic form components we already have.
  - `Test Console`: Build request payloads, run tools, inspect traces.
  - `Deployment Dashboard`: API key management, endpoint URLs, status badges, and log tables.

## Backend Services

### API Layer

- Next.js API Routes (or NestJS Fastify) deployed alongside the frontend. Responsible for authentication, input validation, and orchestrating services.
- Supabase Auth for email magic links + OAuth. Use RLS to enforce tenant boundaries.

### AI Orchestrator

- Composes prompts from stored templates, documentation slices, and user intent.
- Calls OpenAI (GPT-4.1 or better) through the official SDK.
- Post-processes responses: enforce JSON schema, eject invalid proposals back to the user for correction (display warnings via UI toast).
- Supports multi-turn refinement: persist conversation state keyed by session in Supabase.

### Documentation Parser Service

- Extracts metadata from XML/JSON uploads using `fast-xml-parser`, `json-schema-refiner`, and heuristics.
- Normalises operations: `operationId`, `method`, `path`, `parameters`, `requestBody`, `response`.
- Stores raw source + parsed artifacts in Supabase tables.

### MCP Core Service

- Generates `/tools` payload from approved tool definitions.
- Handles `/call` invocations:
  - Fetch tool config from Supabase (versioned).
  - Validate inputs with AJV (reuse schema strategy proven in existing workflow engine).
  - Execute mapped client API call using `fetch` with configurable auth (basic, header token, query token).
  - Transform response via user-defined mapping (support JSONata-lite or mapping DSL).
- Logs every invocation to Supabase (`mcp_invocations`, `mcp_logs`).
- Supports sandbox vs production clients by toggling credential sets.

### Supabase Utilisation

- **Database:** Postgres with RLS.
  - `organizations`, `users`, `memberships`
  - `api_documents` (raw content, metadata)
  - `parsed_operations` (one per endpoint/action)
  - `tool_blueprints` (draft AI output + status)
  - `tool_versions` (published definitions, JSON schema)
  - `mcp_instances` (generated endpoints, API keys, status)
  - `invocation_logs`, `audit_events`
- **Storage:** Document originals and attachments (XML/JSON uploads).
- **Edge Functions:** Security-sensitive MCP webhooks (key rotation, signed receipts).
- **Realtime:** Broadcast tool updates to collaborating users; update activity panels.

## Data & Control Flow

1. **Intake:** User uploads CapCorn XML doc; backend stores file, parser service extracts endpoints (`RoomAvailability`, `OTA_HotelResNotifRQ`).
2. **Curation:** User highlights relevant sections and defines desired agent capabilities (e.g., check availability, create reservation).
3. **Prompting:** Frontend sends curated snippets to AI orchestrator with template instructions. Response includes suggested MCP tool schema, parameter descriptions, validation logic, and sample invocation.
4. **Review:** User adjusts proposals inside Tool Canvas; UI enforces schema completeness using the same validation patterns as the workflow editor.
5. **Publishing:** On approval, backend persists a new `tool_version`, regenerates `/tools` manifest, issues/rotates API key, and deploys to MCP adapter route.
6. **Testing:** Test console hits `/call` with sample payload; response logged in Supabase, surfaced in UI timeline.
7. **Integration:** Provide shareable MCP endpoint URL + API key for external agents (Custom GPT, other MCP clients).

## Security & Reliability

- Supabase Auth tokens exchanged for signed JWT session; API routes verify.
- Multi-tenant boundary enforced via RLS on every table.
- API keys hashed before storage (`mcp_instances.api_key_hash`), shown only once on creation.
- Request signing optional for client APIs needing HMAC.
- Tool execution executes inside isolated serverless function with timeout & retry controls.
- Observability via Supabase logs + optional OpenTelemetry pipeline (OTLP exporter).

## UI Reuse Strategy

- Port the component library (dialogs, tabs, accordions, toasts, forms) into a shared package.
- Reimplement canvas using React Flow, reusing styling tokens and node panels from the previous project.
- Maintain dynamic form builder: JSON schema → form config pattern already used for workflows; adapt to MCP parameter editing.
- Reuse validation layer (AJV configuration, error banners) to guarantee tool correctness before publishing.

## Deployment Plan

- **Frontend/API:** Vercel (supports Next.js hybrid rendering). Environment secrets managed via Vercel + Supabase.
- **Supabase:** Managed Postgres + Auth + Storage.
- **Edge MCP Routes:** Optional Vercel Edge Functions for low-latency `/call` handling with fetch caching.
- **CI/CD:** GitHub Actions for lint/test/build; preview deployments for feature branches.

## Implementation Roadmap

1. **Bootstrap**
   - Scaffold Next.js project with Supabase Auth.
   - Migrate UI primitives and theme tokens.
2. **Documentation Intake MVP**
   - File upload, XML parsing pipeline, storage.
   - Manual endpoint tagging UI.
3. **AI-Assisted Tool Drafting**
   - Prompt templates for availability + booking.
   - Response validation + diff approval flow.
4. **Tool Canvas Builder**
   - Node palette, drag/drop, schema inspector, validation.
   - Versioning + publish workflow.
5. **MCP Adapter Service**
   - `/tools` & `/call` endpoints.
   - Client API execution layer with logging.
6. **Testing & Observability**
   - Test console, log viewer, metrics hooks.
7. **Hardening**
   - Auth enhancements, API key rotation, rate limiting.
   - Multi-tenant RLS, audit events, alerting.

## Detailed Implementation Plan

### Phase 0 – Discovery & Foundations (Week 0-1)
- Inventory reusable UI modules, TypeScript types, validation helpers, and workflow engine patterns from the prior project; decide which to extract into a shared package (`packages/ui`, `packages/validation`).
- Draft Supabase schema migrations locally using `supabase db diff`; confirm RLS policies for `organizations`, `tool_versions`, and `invocation_logs`.
- Establish design tokens and tailwind/theme configuration to mirror the existing visual language (animations, shadows, panel surfaces).
- Configure monorepo tooling (Turborepo or Nx) so shared code can be reused by both frontend and server packages.

### Phase 1 – Project Bootstrap (Week 1-2)
- Create Next.js 15 app with App Router, TypeScript strict mode, ESLint/Prettier baseline, Playwright + Vitest test harness.
- Integrate Supabase client (server + browser helpers) and set up Auth UI scaffolding (magic links/OAuth).
- Implement global providers (theme, Zustand store, Query client) and layout scaffolding (sidebar navigation, main workspace).
- Port toast/notification system, dialog primitives, and typography components to ensure consistent UX from day one.

### Phase 2 – Documentation Intake & Catalog (Week 2-3)
- Build upload pipeline: drag/drop zone, Supabase storage upload, progress feedback, error handling.
- Implement parsing worker (Edge Function or API route) that reads XML/JSON, invokes `fast-xml-parser`, normalises operations, and stores in `parsed_operations`.
- Create documentation explorer UI: list detected operations, rendered request/response schemas, credentials, sample payloads. Provide manual edit controls using schema-aware forms and AJV validation.
- Add annotation tools allowing admins to highlight sections that should influence AI prompt generation (store selections with ranges).

### Phase 3 – AI-Assisted Tool Authoring (Week 3-4)
- Define prompt templates combining selected documentation excerpts, desired capability, and output schema instructions. Persist templates in Supabase for reuse.
- Implement AI orchestrator route: accepts prompt payload, calls OpenAI, enforces JSON schema (using the validated parser pattern), and returns structured candidate tool definitions.
- Build review UI: diff viewer (proposed vs last accepted), confidence indicators, inline issues surfaced from schema validator.
- Allow iterative refinement: users can add follow-up instructions, rerun, and version candidate outputs before publishing.

### Phase 4 – Tool Canvas Builder (Week 4-6)
- Port canvas infrastructure (React Flow, node panels, minimap) and align styling with the previous workflow builder.
- Define node library: `Input`, `Transform`, `External API Call`, `Response Mapper`, `Post-Process`. Each node backed by JSON schema-driven forms and dynamic validation.
- Implement data binding UX reused from workflow project (data point selectors, parameter chips, connection handles).
- Add validation overlay: highlight disconnected nodes, missing mappings, schema mismatches, and authentication gaps before allowing publish.
- Persist draft blueprints in Supabase with autosave and optimistic updates; enable collaborative presence indicators via Supabase Realtime.

### Phase 5 – MCP Adapter & Execution (Week 6-8)
- Implement `/tools` builder service that composes metadata from published tool versions and caches canonical JSON for fast responses.
- Create `/call` handler that loads tool definition, validates request payload (AJV), resolves credentials, and executes outbound HTTP calls with retries/timeouts derived from config.
- Provide response transformation engine (JSONata-lite or template DSL) so outputs conform to MCP expectations.
- Log every invocation with status, latency, response snippet, and error traces for observability. Surface metrics in dashboard cards.
- Expose key management UI: generate, rotate, revoke API keys; show hashed keys; enforce per-tenant rate limits.

### Phase 6 – Testing Console & Observability (Week 7-9)
- Build in-app test console replicating MCP tool calls: parameter builders, credential selectors, live response view, and replay capability.
- Implement timeline view for invocations using virtualised list, filters (status, tool, date), and structured error insights.
- Integrate alerting hooks (webhooks or email) for repeated failures, credential expirations, or unusual traffic.
- Add opt-in sandbox connectors for demo bookings (mock responses preloaded from CapCorn sample data).

### Phase 7 – Hardening & Launch (Week 9-10)
- Pen down security checklist: RLS verification, API rate limiting, audit events on sensitive actions, session expiration policies.
- Introduce organisation/team management (invites, roles: Owner, Builder, Viewer) and enforce throughout UI via feature gates.
- Benchmark MCP call latency and optimise (edge deployment, keep-alive, connection pooling).
- Prepare deployment pipelines: GitHub Actions for lint/test/build, Vercel preview links, Supabase migrations gating.
- Create onboarding guides, sample datasets, and pre-built templates for CapCorn availability/booking flows.

### Continuous Workstreams
- **Design System:** Continue to evolve shared UI kit, ensuring new components (schema diff viewer, invocation timeline) follow established patterns.
- **DX Tooling:** Maintain schema generators, type-safe Supabase queries, and storybook playground for complex components like the canvas.
- **Feedback Loop:** Capture telemetry on AI suggestion acceptance rates, canvas validation errors, and invocation failures to prioritise improvements.

## Next Steps

- Define prompt templates tailored to CapCorn documentation structure.
- Draft Supabase migration files for core tables.
- Identify UI components requiring adaptation (drag handles, modals, toasts) and plan extraction into a shared package.
- Outline edge cases for tool execution (timeouts, partial failures) and incorporate into MCP service design.

