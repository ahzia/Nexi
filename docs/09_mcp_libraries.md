## ✅ Existing libraries / npm packages

Here are some libraries you can use or evaluate:

* @ivotoby/openapi-mcp-server: “A Model Context Protocol (MCP) server that exposes OpenAPI endpoints as MCP resources.” ([npm][1])
* @reapi/mcp-openapi: “Loads and serves multiple OpenAPI specifications to enable LLM-powered IDE integrations.” ([npm][2])
* @openapi-mcp/server: “Automatically converts any OpenAPI/Swagger API specification into MCP tools that can be used by AI assistants.” ([npm][3])
* @taskade/mcp-openapi-codegen: A code-generation package: “Generate MCP tools from any OpenAPI Schema in seconds.” ([npm][4])
* openapi-mcpserver-generator: CLI tool generating MCP server code from OpenAPI specs. ([npm][5])
* @tyk-technologies/api-to-mcp: Another tool stating “creates a dynamic MCP server that transforms OpenAPI specifications into MCP tools”. ([npm][6])

---

## ⚠️ Useful caveats & limitations (especially for your Nexi use-case)

* Many of these tools **automatically generate MCP servers** from OpenAPI specs, which is great — but they may assume your existing backend is *fully described* by an OpenAPI spec (operationIds, parameters, etc). If your hotel API is custom or lacks full spec, you might still need to augment.
* Some tools may support only **GET/READ** operations or may have limited support for certain auth flows (OAuth, cookie, etc). For booking flows (which include POST, payment, etc) you’ll want robust support.
* Generated tools might need customization: you’ll still want to add custom metadata (descriptions, tool-friendly names), handle error flows (no availability), and inject your business logic (e.g., two-phase booking).
* For your “canvas UI / no-code builder” idea: these generators can serve as the backend engine or scaffold, but you’ll still build the visual mapping interface yourself.
* Compatibility & maturity: MCP is still relatively new, ecosystem tools may have varying levels of support or embedded assumptions. You’ll test end-to-end with your target AI (like ChatGPT) to ensure it works.

---

## 🧭 How this fits into your Nexi architecture

Because you’ve chosen to build Nexi (Next.js + Supabase + visual builder + MCP adapter), here’s how you can integrate these libraries:

* Use one of the generation tools (for example `@taskade/mcp-openapi-codegen` or `openapi-mcpserver-generator`) to **automatically create MCP tool definitions / server scaffold** from your hotel’s OpenAPI spec (or from your API endpoints once you define an OpenAPI spec).
* Use that generated code as the base for your MCP Adapter in Nexi. Then, wrap or extend it with your business logic (booking rules, logging, audit, Supabase hooks).
* Your Canvas UI can let the user upload or paste an OpenAPI spec (or define endpoints manually) → the backend uses the generator library to build MCP metadata/tools → store tool config in Supabase → deploy the adapter endpoint to host.
* You’ll still implement the `/tools` endpoint, the tool invocation routing, and ensure the mappings to backend endpoints (your hotel API) are correct and secure.

---

## 🚀 Recommendation for your hackathon MVP

Given your timeline and goals, I recommend:

1. **Select one of the generator libs** (for example `@taskade/mcp-openapi-codegen`) to accelerate conversion of your hotel API’s spec into MCP tools.
2. **Define or refine your hotel API’s OpenAPI spec** (if not already done) for endpoints like `/availability`, `/book`, `/rooms/:id`. Ensure each operation has an `operationId` (many generator tools require this).
3. **Use generated scaffold** as your adapter base. Then implement the booking logic / logging / Supabase integration.
4. **In the Canvas UI**, you might allow the user to upload the spec or define tools manually; for MVP, you can pre-seed the tool definitions for your demo hotel to save time.
5. **Test with ChatGPT**: once adapter is deployed, register as connector or Custom GPT, and verify the tool calls succeed (read + write).
6. **Highlight in your hackathon pitch**: “We leveraged existing auto-generation libraries to convert hotel APIs into MCP servers, enabling AI agents to query and book stays directly.”

---

If you like, I can **locate & list 3-5 of the best generator libraries with comparison (features, maturity, limitations)** and we can pick one for Nexi, and I can show you how to integrate it in your Next.js backend. Would you like me to do that?

[1]: https://www.npmjs.com/package/%40ivotoby/openapi-mcp-server?utm_source=chatgpt.com "@ivotoby/openapi-mcp-server - npm"
[2]: https://www.npmjs.com/package/%40reapi/mcp-openapi?utm_source=chatgpt.com "@reapi/mcp-openapi - npm"
[3]: https://www.npmjs.com/package/%40openapi-mcp/server?activeTab=readme&utm_source=chatgpt.com "@openapi-mcp/server - npm"
[4]: https://www.npmjs.com/package/%40taskade/mcp-openapi-codegen?utm_source=chatgpt.com "@taskade/mcp-openapi-codegen - npm"
[5]: https://www.npmjs.com/package/openapi-mcpserver-generator?utm_source=chatgpt.com "openapi-mcpserver-generator - NPM"
[6]: https://www.npmjs.com/package/%40tyk-technologies/api-to-mcp?utm_source=chatgpt.com "tyk-technologies/api-to-mcp - NPM"

---

## 🔍 Alignment with Nexi Requirements

| Library | What It Gives Us | Fit for Nexi | Gaps / Considerations |
| --- | --- | --- | --- |
| `@taskade/mcp-openapi-codegen` | TypeScript code generator (`codegen` API) that produces `setupTools(server, config)` helper for OpenAPI specs. Uses `@readme/openapi-parser`, emits normalize hooks. | **Strong** starting point for deterministic tool generation. We can invoke `codegen()` inside our ingestion pipeline, then transform the generated AST/TS module into JSON tool configs stored in Supabase. | Early 0.0.1 release, emits TS not JSON. Requires Node-fetch/polyfill handling. We’ll add a serializer that walks the emitted module to capture tool metadata (operationId, schemas) before persisting. |
| `@ivotoby/openapi-mcp-server` | Full-featured CLI **and** library (`OpenAPIServer`) with tool filtering, AuthProvider interface, HTTP/STDIO transports, health checks, meta tools. | Useful reference and potential runtime engine. We can depend on it for execution (instantiating `OpenAPIServer` per tenant) once we supply generated spec + auth provider. | Library expects to load OpenAPI spec at runtime; we still need to generate/edit tool definitions in canvas, add Supabase persistence, and expose per-tenant API keys. May require fork/adapters to plug in our logging + multi-tenant auth. |
| `@openapi-mcp/server` | Bun/Node CLI that converts OpenAPI with strict `operationId` requirement; provides HTTP + stdio transport and Zod validation. | Good reference for validation & SSA flows. Could be fallback CLI for quick demos. | Focused on direct conversion, limited auth (no OAuth), expects bundler. Less flexible for integrating with Supabase/canvas. |
| `@reapi/mcp-openapi` | Multi-spec catalog / search service; exposes meta-tools for discovering operations rather than invoking them. | Useful for documentation/IDE integration; can inspire our “spec explorer” view. | Does not perform real HTTP calls; oriented toward metadata, so not sufficient for booking operations on its own. |
| `openapi-mcpserver-generator`, `@tyk-technologies/api-to-mcp` | Limited docs; both claim to auto-generate MCP servers from OpenAPI specs. | Investigate later if we need alternative generators. | Unknown maturity/support; keep as optional references. |

### Key Takeaways
- We still need **structured ingestion + storage** to support our canvas editor and Supabase-backed MCP instances. None of the libraries handle tenant persistence or UI editing out of the box.
- We can adopt `@taskade/mcp-openapi-codegen` to jump-start schema/tool extraction and reduce hand-written mapping logic.
- For runtime execution, `@ivotoby/openapi-mcp-server` is the richest option—we can import its `OpenAPIServer` class, attach our own request pipeline (e.g., custom AuthProvider that pulls credentials from Supabase), and expose the HTTP transport behind our tenancy/auth wrappers.
- Other packages serve as reference implementations or auxiliary tooling but don’t remove the need for our canvas/editor layer.

---

## ✅ Simplified Plan Leveraging These Libraries

1. **Spec ingestion service**
   - Use `@readme/openapi-parser` (via `@taskade` dependency) to dereference JSON/YAML specs.
   - Invoke `codegen({ document })` from `@taskade/mcp-openapi-codegen` and capture the generated tool metadata (operationId, parameters, response schemas).
   - Convert the generated TypeScript structures into our internal JSON schema format and persist to `tool_blueprints` (alongside raw OpenAPI spec) in Supabase.

2. **Manual augmentation & canvas**
   - Populate the canvas nodes with the generated tools.
   - Allow users to edit descriptions, rename tools, tweak input/output schemas, or add non-OpenAPI steps (e.g., 2-phase booking logic).
   - Store edits as `tool_versions` per `07_supabase_mcp_mapping.md`.

3. **Runtime execution layer**
   - On publish, instantiate an `OpenAPIServer` (from `@ivotoby/openapi-mcp-server`) or selectively reuse its request execution utilities.
   - Inject a custom `AuthProvider` that fetches credentials from Supabase, handles token refresh, and enforces per-tenant restrictions.
   - Wrap the server with our streamable HTTP transport, API key auth, logging, and rate limiting.
   - Optionally expose `dynamic` meta-tools (`list-api-endpoints`, etc.) for debugging/admin usage.

4. **Integration bundle**
   - Reuse our existing MCP metadata pipeline (`06_mcp_client_integration.md`) to generate:
     - Discovery file (`/.well-known/mcp.json`)
     - Capability manifest
     - Instructions for ChatGPT Custom GPT & Claude (endpoint, API key header, sample tool list).

5. **Fallback when specs are incomplete**
   - If spec parsing fails (e.g., CapCorn XML docs), fall back to our heuristic + manual mapping workflow (documented in `08_end_to_end_user_flow.md`).
   - AI assistance remains optional: use it only to suggest descriptions or fill gaps, but keep validation deterministic.

6. **Testing & validation**
   - Add automated tests that spin up the generated `OpenAPIServer` in-memory, run sample `tools/call` requests, and verify responses before publishing.
   - Maintain compatibility tests against ChatGPT/Claude handshake flows.

This approach lets us stand on the shoulders of existing generators/servers without sacrificing the multi-tenant persistence, canvas editing experience, or runtime control that Nexi requires. We can swap out libraries later if better options emerge, but this stack minimizes bespoke code in the high-risk spec-to-tool conversion and HTTP execution layers.
