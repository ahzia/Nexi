# Nexi MCP Builder – End-to-End Flow Feasibility

This note validates the proposed user journey for a hotel client generating an MCP endpoint and highlights what we can deliver now vs. what needs additional work. It references our existing architecture plans (`04_nexi_system_architecture.md`), MCP compliance notes (`05`, `06`), and insights from the Chrome extension project for UI/UX inspiration.

---

## 1. Proposed Flow Overview

1. **Launch app** (single tenant for MVP).  
2. **“Generate MCP” entry point** (rename to “Create AI integration”?).  
3. **Input source**: upload machine-readable spec (OpenAPI JSON/YAML) or paste unstructured docs like `03_example_customer_api_documentation.md`.  
4. **Parse & normalize**: produce internal REST operation list + schemas.  
5. **MCP scaffolding**: create initial tool definitions, descriptions, request/response mappings using deterministic code, only falling back to AI for missing metadata.  
6. **Persist**: store spec, tool drafts, generated MCP config in Supabase (per tenants).  
7. **Canvas editor**: visualize tools (similar to extension workflow builder), allow edits, additions, re-publish.  
8. **Publish**: deploy MCP instance, expose setup info (endpoint URL, API key, instructions for ChatGPT/Claude).  
9. **Runtime**: agent (ChatGPT, etc.) calls `tools/call`; Nexi server validates, calls downstream hotel API, formats response, returns to agent.

---

## 2. Feasibility Assessment

### 2.1 Spec Ingestion
- **OpenAPI JSON/YAML**: Use `swagger-parser`, `openapi-types` to parse; derive operations, parameters, response schemas. Highly feasible.  
- **Unstructured docs (CapCorn example)**: Needs NLP to extract endpoints, fields; more complex but we can set heuristic pipeline:
  - Extract code blocks/XML blocks.
  - Identify endpoints via regex (`https://...RoomAvailability`) and parameter lists.
  - Manual annotation UI may be required if parsing fails.  
  Feasible with structured wrappers + optional AI summarization.

### 2.2 MCP Tool Generation
- From structured spec we can deterministically map “operation” → “tool”:
  - `description`: from endpoint summary/operationId.
  - `inputSchema`: translate OpenAPI request schema to JSON schema.
  - `outputSchema`: convert response schema; fallback to basic structured content if not available.
  - `execution metadata`: HTTP method, URL, headers, body template.
- For missing descriptions, consider templated fallback (“Calls CapCorn RoomAvailability to fetch room offers.”). Only use AI for enhancing text if desired.  
Feasible with custom transformation code + JSON Schema generator.

### 2.3 Canvas Editor
- Reuse patterns from extension’s workflow builder:
  - Drag nodes, double-click to edit config.
  - JSON schema forms for inputs/outputs (AJV + form renderers).
  - Live validation highlights.  
  Need to port React Flow setup, theming, and data binding patterns. Workable given existing UI foundation.

### 2.4 MCP Publication & Runtime
- Already designed in `05`, `06`, `07`:
  - Store tool versions, generate discovery files, hashed API keys.
  - Implement streamable HTTP transport, validation, downstream call handling.  
  Feasible; requires backend work but architecture defined.

### 2.5 Agent Integration
- We documented requirements for Custom GPT and Claude; once endpoint + API key provided, clients can use tools.  
  Need to generate integration bundle (base URL, key, instructions). Feasible.

---

## 3. Dependencies & Risks

| Area | Risk | Mitigation |
|------|------|------------|
| Unstructured doc parsing | Hard to perfectly map CapCorn-style docs | Provide manual mapping UI; AI assist as fallback |
| Schema completeness | OpenAPI might lack response descriptions | Use generic schema + note manual review required |
| Tool accuracy | Wrong parameter mapping could break bookings | Add validation/test flow (dry-run call) before publish |
| UI complexity | Canvas editing + JSON forms can be heavy | Leverage extension UI components; build incremental |
| Security | API keys & credentials handling | Implement hashing/encryption per `07_supabase_mcp_mapping.md` |

---

## 4. Proposed Implementation Steps

1. **Spec ingestion MVP**
   - Support OpenAPI upload (JSON/YAML).
   - Basic parser to extract operations, parameters, response schemas.
2. **Tool generation service**
   - Convert operations → internal tool config.
   - Persist in `tool_blueprints`.
3. **Canvas UI initial version**
   - Render generated tools as nodes (read-only).
   - Allow editing fields via inspector panel.
4. **Publish pipeline**
   - On save, validate schemas, create `tool_versions`, set up MCP instance metadata.
   - Generate API key + discovery payload.
5. **Runtime executor**
   - Streamable HTTP endpoint with validation, HTTP call runner, logging.
6. **Integration instructions**
   - Auto-generate instructions for ChatGPT/Claude (URL, key, tool list).
7. **Unstructured doc support**
   - Add doc upload + manual mapping UI.
   - Optional AI summarization to pre-fill descriptions.
8. **Testing harness**
   - Automated handshake tests for GPT/Claude style clients.
   - Dry-run API call tester in UI.

---

## 5. UI Inspiration from Extension Project

- **Quickbar/Playground**: use panel layout, theme tokens, form inputs.  
- **Workflow builder**: port drag/drop, inspector patterns, AJV validation overlays.  
- **Theme**: reuse design system from extension (`theme.css` analog).  
- **Storage**: original extension used local storage; adapt logic to Supabase + API calls.

---

## 6. Open Questions

- Should we require manual confirmation of each generated tool before publish?  
- Do we offer test sandbox (mocked responses) for customers without live API access?  
- How to handle authentication schemes (API keys, OAuth) from spec ingestion? Need credential editor UI.

---

## 7. Conclusion

The outlined flow is achievable:
- Deterministic pipelines cover structured specs; manual tooling covers gaps in unstructured docs.  
- Backend design already matches MCP requirements.  
- UI components can be heavily inspired by the extension project.  
- Remaining work focuses on spec parsing robustness, canvas UX, and secure runtime execution.  
No blockers identified; proceed with incremental build, starting with OpenAPI ingestion → tool generation → canvas → MCP publish.

