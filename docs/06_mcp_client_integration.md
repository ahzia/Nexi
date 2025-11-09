# MCP Client Integration Checklist (ChatGPT, Claude, Others)

This note unifies the currently published requirements for connecting remote MCP servers to popular agent clients and maps them to Nexi’s deliverables. Use it to ensure that every generated MCP instance is immediately consumable by Custom GPTs (OpenAI), Claude, and any client that implements the 2025‑06‑18 MCP specification.

---

## 1. Protocol Compliance Guarantees

- **Transport**: Remote clients (OpenAI GPTs, Claude, Kiro, etc.) currently expect **streamable HTTP** transport. The 2025‑06‑18 spec names this as the recommended network option for remote servers, replacing older SSE transport.  
  Ensure `POST /mcp/stream` (or equivalent) implements the streaming response contract described in `/specification/2025-06-18/basic/transports`.
- **Capabilities**: During `initialize`, advertise the exact capabilities implemented (`tools`, `resources`, `prompts`, `logging`, `pagination`). GPTs and Claude both inspect this payload to decide which tabs/UI to expose.
- **Schema**: Tool definitions, request arguments, and results must follow the JSON Schema forms defined in `/specification/2025-06-18/server/tools` and `/specification/2025-06-18/schema`. The clients run schema validation before exposing UI controls.
- **Error Contract**: Distinguish protocol-level JSON-RPC errors (e.g. unknown tool) from business errors (`result.isError = true`). Both ChatGPT and Claude rely on this to decide if they can retry or ask the user for clarification.

---

## 2. Custom GPT (OpenAI) Requirements

Based on the GPT Builder UX announced with MCP support (October 2024) and subsequent updates:

> *In the Actions panel, creators can click “Add Model Context Protocol server,” provide the HTTPS base URL, optional API key header name/value, and (if provided) a documentation URL for end users.* – OpenAI GPTs Reference (captured October 2024 edition)

**What Nexi must provide per MCP instance:**

1. **Public HTTPS endpoint** implementing streamable HTTP transport. Example base URL:  
   `https://mcp.nexi.app/{tenantSlug}`
2. **API key header configuration** (optional but strongly recommended). GPT Builder allows:
   - Header name (default `Authorization`)  
   - Secret value (e.g. `Bearer sk_live_xxx`)  
   Nexi should surface this as copyable credentials in the dashboard.
3. **Capability summary** for copy/paste into GPT description:
   - Short text explaining what the tools do, required parameters, and safety constraints.
4. **Testing instructions**: Creators usually run `tools/list` from the GPT builder diagnostic modal. Nexi should expose a “Test in GPT” button that performs the same handshake to confirm connectivity.

**Agent behavior to account for:**

- GPT Builder previews tool schemas, so large or circular schemas may be rejected. Keep tool schemas concise and document optional fields.
- GPTs do not currently forward end-user files through MCP; any file inputs must be handled via URLs or base64 fields.
- Rate limiting: GPTs will retry failed calls quickly. Implement idempotency and 429 handling.

---

## 3. Claude Desktop / Anthropic Requirements

Anthropic’s remote MCP guidance (2024‑11) highlights:

- Servers **must be reachable via TLS** and use streamable HTTP.
- Claude Desktop allows per-server API key headers and supports progress/logging notifications.
- Tool descriptions are rendered directly in the assistant UI—avoid hidden instructions; sanitize descriptions to prevent indirect prompt injection.

**Nexi actions:**

- Provide per-tenant API key + header instructions (same as GPTs).
- Ensure `notifications/progress` and `notifications/logMessage` are optional but can be enabled; Claude renders progress neatly.
- Publish privacy policy and data retention statement (Claude prompts users to review server policies before enabling).

---

## 4. Other Clients (Kiro, Kagi, first-party SDKs)

- **Kiro** and **MCP Inspector** require a JSON discovery endpoint (`GET /.well-known/mcp.json`) listing supported transports and base URLs. We should auto-generate this file:
  ```json
  {
    "version": "2025-06-18",
    "servers": [{
      "transport": "stream-http",
      "url": "https://mcp.nexi.app/{tenantSlug}"
    }]
  }
  ```
- **Kagi Sidekick** uses the same transport but enforces strict response times (<30s). Ensure timeout + fast fail support.
- **Open-source SDKs**: Most map directly to the spec; our compatibility test suite should hit:
  - `tools/list`
  - `tools/call` (success + `isError`)
  - `notifications/progress`
  - `resources/list` (if we expose documentation or logs)

---

## 5. Deliverables for Nexi Platform

| Deliverable | Purpose | Surfaced To |
|-------------|---------|-------------|
| MCP Endpoint URL | Remote transport base path with tenant slug | Admin UI, copyable |
| API Key (hashed at rest) | Auth between client agent and Nexi | Admin UI + GPT/Claude setup instructions |
| Capability manifest (JSON) | `initialize` response snippet | Download JSON & render in UI |
| Tool catalog | Flattened view of `tool_versions` for human review | Tenant dashboard |
| Demo requests | Pre-built `tools/call` payloads for Postman/curl | Docs & UI |
| Discovery file | `/.well-known/mcp.json` served publicly | Automated |
| Privacy & usage policy | Required by Claude/GPT custom actions | Docs |

---

## 6. Validation Steps Before Publishing an MCP Instance

1. **Schema lints**: AJV validation on inputs/outputs.
2. **Spec coverage tests**:
   - Run handshake using GPT-compatible harness (simulate GPT builder handshake).
   - Run Claude MCP smoke test (POST `/mcp/stream` with progress notifications).
3. **Latency checks**: Ensure typical `tools/call` completes < 10s; set up queue + progress events for longer tasks.
4. **Security checks**:
   - API key stored hashed in Supabase (`mcp_instances.api_key_hash`).
   - RLS rules restrict tool configs to owning org.
   - Outbound HTTP is limited to whitelisted hostnames per tenant.
5. **Documentation refresh**:
   - Export integration instructions (GPT & Claude) including endpoint, key, sample prompts.
   - Update version history (`tool_versions.version`).

---

## 7. Pending Research / Open Questions

- **OpenAI GPT Builder updates**: Confirm whether future releases will require mutual TLS or allow environment variables for secrets. Track GPTs reference changelog quarterly.
- **Claude Workspace policies**: Anthropic hinted at workspace-level approval for external servers. Monitor for any new attestations we must supply (security questionnaires, SOC2).
- **Other agent ecosystems**: Keep watch on Microsoft Copilot and Kagi Sidekick MCP adapters for additional headers or handshake quirks.

---

## Next Actions

1. **Automate compatibility tests**: Add CI job hitting GPT & Claude style handshakes before allowing publication.
2. **Generate setup bundles**: For each MCP instance export a ZIP with discovery file, capability JSON, tool schemas, and step-by-step GPT/Claude instructions.
3. **Document privacy & data usage**: Work with legal/ops to publish a per-tenant policy ready for GPT/Claude review screens.
4. **Track spec revisions**: Subscribe to MCP 2025+ changelog to adjust transports or schema changes early.


