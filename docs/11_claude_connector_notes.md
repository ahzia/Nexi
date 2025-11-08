# Claude MCP Connector Notes

_Last updated: 2025-11-08_

## Observable Connector Behaviour

- **HTTP verb probes** – Claude issues a `HEAD` request to verify the MCP endpoint is reachable before any JSON-RPC payload. Returning `405` (Method Not Allowed) can terminate setup, so Nexi now responds `200` with an `Allow` header.
- **Session cleanup attempt** – Claude immediately follows the initial `POST` with `DELETE` (no body) against the same path. This behaves like a best-effort teardown/health reset. We respond with a benign `200` + `{ status: "noop" }` so the client treats it as success while retaining published state.
- **Repeated `POST`** – After the `DELETE`, Claude retries `POST` with the actual JSON-RPC handshake (`initialize`, `tools/list`, etc.). Once verbs above return 2xx the workflow proceeds normally.

## Compatibility Checklist (from Claude docs)

Official guidance (see [Claude Docs – MCP connector](https://docs.claude.com/en/docs/agents-and-tools/mcp-connector) and [Help Center – Remote MCP](https://support.claude.com/en/articles/11176164-pre-built-web-connectors-using-remote-mcp)) highlights the following requirements:

- Endpoint must be **publicly reachable over HTTPS** using either streamable HTTP or SSE transports.
- Only **tool calls** from the MCP spec are currently supported (`initialize`, `tools/list`, `tools/call`). Prompts/resources are ignored.
- **Authentication**: Claude supports Bearer tokens if required. Anonymous endpoints must still respond deterministically (no redirects or HTML challenges).
- **CORS isn’t required** for Claude clients, but `OPTIONS` should return 204 with method hints to satisfy standard HTTP middleware.
- **JSON-RPC 2.0 compliance** – All responses must include `jsonrpc: "2.0"`, echo the `id`, and surface errors via the `error` envelope.
- **Tool schema completeness** – Claude inspects `tools/list` and expects each tool to define `name`, `description`, and `inputSchema`. Missing fields cause discovery failure.
- **Latency budget** – Documentation recommends keeping tool calls < 10s; longer operations should stream or chunk.

## Nexi Follow-up Actions

- ✅ Support `HEAD`, `OPTIONS`, `DELETE` with harmless responses in `api/mcp/[slug]` to satisfy connector probes.
- ☐ Consider returning Claude-specific troubleshooting info (e.g. instructions on supplying credentials) inside the discovery manifest for better UX.
- ☐ Monitor deployment logs for non-200 verbs after this change; if Claude starts sending additional methods (PATCH, TRACE, etc.) add them to the handler whitelist.

## Troubleshooting Tips

1. **Verify tool discovery** – Call `POST /api/mcp/<slug>` manually with `tools/list`. Ensure every tool has non-empty `description` and `inputSchema`.
2. **Schema drift** – If Claude reports schema issues, compare Nexi’s generated schema with OpenAPI source; fix missing required fields before publishing.
3. **Credentials** – When using Bearer auth, double-check Claude’s connector configuration matches Nexi’s generated key and that the instance’s `requireKey` flag reflects expectations.
4. **Transport checks** – Some corporate proxies block `DELETE` or strip headers; confirm with `curl -v` that responses stay 2xx.

---

_Sources consulted: Claude Docs “MCP connector”, Claude Help Center “Pre-built Web Connectors Using Remote MCP”, deployment logs from `nexi-sage.vercel.app`._
