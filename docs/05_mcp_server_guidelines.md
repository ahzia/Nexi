# MCP Server Guidelines for Nexi

This document consolidates the key requirements from the latest Model Context Protocol (MCP) specification (2025‑06‑18 release) and frames them around Nexi’s goal: turn API documentation (e.g. CapCorn Hotel XML) into MCP-compliant servers that agents like ChatGPT can call safely.

---

## 1. MCP Server Responsibilities

- **Transport**: MCP uses JSON-RPC 2.0 over one of the supported transports (stdio, HTTP streaming, gRPC). Nexi will target HTTP streaming for hosted deployments.
- **Lifecycle**:
  1. Client connects and sends `initialize` with declared capabilities.
  2. Server responds with supported capabilities (`tools`, `resources`, `prompts`, optional utilities) and optional `serverInfo`.
  3. Once initialized, the client may call feature-specific methods such as `tools/list` or `tools/call`.
- **Capabilities**: Servers enumerate supported features in the `initialize` response. Nexi servers must at minimum declare the `tools` capability. Optional features (resources, prompts, pagination, logging, etc.) can be announced as they are implemented.

---

## 2. Core Methods & Message Shapes

All MCP messages follow JSON-RPC 2.0 (`jsonrpc: "2.0"`) and include `id` (for requests/responses) or `method` (for notifications). Key server-side handlers:

### `tools/list`

- **Purpose**: Enumerate available tools with metadata.
- **Request**: `{ "method": "tools/list", "params": { "cursor"?: string } }`
- **Response**: `{ "result": { "tools": Tool[], "nextCursor"?: string } }`
  - `Tool` includes:
    - `name`: unique identifier (`availability_search`)
    - `description`: natural language summary for the LLM
    - `inputSchema`: JSON Schema describing required arguments
    - `outputSchema` (optional but recommended): structure of successful responses
    - Optional `annotations` (audience, priority, etc.)
- **Pagination**: If the server has many tools, support `nextCursor`.

### `tools/call`

- **Purpose**: Execute a tool with validated inputs.
- **Request**:
  ```json
  {
    "method": "tools/call",
    "params": {
      "name": "availability_search",
      "arguments": { ... },
      "_meta"?: { "progressToken"?: string }
    },
    "id": "uuid"
  }
  ```
- **Response**:
  ```json
  {
    "jsonrpc": "2.0",
    "id": "uuid",
    "result": {
      "content": ContentBlock[],
      "structuredContent"?: object,
      "isError"?: boolean
    }
  }
  ```
  - `ContentBlock` entries carry unstructured output (`type: "text" | "image" | "resource_link" | ...`).
  - `structuredContent` is recommended for machine-readable payloads (e.g. parsed XML availability results).
  - Set `isError: true` for domain failures (API returned an error), and include explanation in `content`. Protocol-level issues (unknown tool, invalid JSON) must be raised as JSON-RPC errors instead.

### Utility Notifications (Optional but Valuable)

- **`notifications/progress`**: when receiving `_meta.progressToken`, emit progress updates to improve UX during long-running CapCorn calls.
- **`notifications/logMessage`**: stream diagnostic logs (info/warn/error) back to clients if logging utility is declared.

---

## 3. Tool Design Blueprint for Nexi

1. **Input Schema Construction**
   - Derive fields from client documentation (e.g. CapCorn’s XML tags).
   - Use JSON Schema draft 2020-12 (objects with `properties`, `required`, `enum`, `format`, etc.).
   - Example for CapCorn availability:
     ```json
     {
       "type": "object",
       "required": ["arrivalDate", "departureDate", "hotelId", "rooms"],
       "properties": {
         "hotelId": { "type": "string", "description": "CapCorn hotel_id (e.g. 9100)" },
         "arrivalDate": { "type": "string", "format": "date" },
         "departureDate": { "type": "string", "format": "date" },
         "rooms": {
           "type": "array",
           "items": {
             "type": "object",
             "required": ["adults"],
             "properties": {
               "adults": { "type": "integer", "minimum": 1 },
               "children": {
                 "type": "array",
                 "items": {
                   "type": "object",
                   "required": ["age"],
                   "properties": {
                     "age": { "type": "integer", "minimum": 0, "maximum": 17 }
                   }
                 }
               }
             }
           }
         }
       }
     }
     ```
2. **Output Schema Strategy**
   - Provide structured JSON mirroring the original response but with friendlier names (e.g. convert `<option><catc>…` to `categoryCode`).
   - Map nested data (rooms, pricing, board) and include `sourcePayload` if raw XML/JSON is necessary.
3. **Tool Names & Descriptions**
   - Use lowercase snake or kebab case (`availability_search`, `create_reservation`).
   - Descriptions must cue the LLM about preconditions, limitations (max 10 rooms), and credential handling.
4. **Error Handling**
   - Convert HTTP or XML errors into `isError: true` responses with human-readable text explaining what happened and how to retry (e.g. invalid dates).
   - Log recoverable errors via `notifications/logMessage` when available.

---

## 4. Initialization Payload Expectations

When Nexi deploys an MCP server, the `initialize` response should resemble:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "capabilities": {
      "tools": { "list": true, "call": true, "subscribe": false },
      "resources": { "list": true, "read": true },          // when we expose cached docs/logs
      "prompts": { "list": false },
      "logging": { "supportsNotify": true },                // optional
      "pagination": { "tools": true }                       // optional
    },
    "serverInfo": {
      "name": "nexi-capcorn-hotel-mcp",
      "version": "0.1.0",
      "description": "CapCorn Hotel availability & booking tools via Nexi"
    }
  }
}
```

Clients use this data to decide which flows are supported.

---

## 5. Security & Auth Considerations

- **Authentication**: MCP spec leaves auth to transport. For hosted HTTP endpoints, use API keys or OAuth 2.1 (recommended). Keys should be hashed at rest (Supabase) and rotated via UI.
- **Least Privilege**: Each Nexi deployment is tenant-scoped. Tools should only reach whitelisted downstream endpoints (CapCorn base URL).
- **Validation**: Always validate inputs against the JSON Schema before calling external APIs. Reject or coerce unknown fields to prevent injection.
- **Logging**: Avoid leaking credentials in logs. Use structured logging with correlation IDs to trace `tools/call` → CapCorn request → response.
- **Rate Limiting**: Apply per-key or per-tenant quotas to mitigate abuse.
- **Data Protection**: If returning raw XML, consider redacting secrets (e.g. PINs) and annotate outputs with `annotations.audience` so clients know whether content is for the user or assistant only.

---

## 6. Mapping Nexi Workflow to MCP

| Nexi Stage | MCP Artifact | Notes |
|------------|--------------|-------|
| Documentation ingestion | Stored in Supabase `api_documents` | Feeds prompt templates and schema builders |
| AI-assisted schema drafting | Candidate `Tool` definitions | Validate against JSON Schema, require manual approval |
| Canvas configuration | `Tool` metadata and execution pipeline | Node graph outputs final request/response transformers |
| Publish | Persisted `tool_version` & `mcp_instance` | Triggers regeneration of `/tools` manifest |
| Invocation | `tools/call` handler | Executes HTTP request, transforms response, logs, returns result |

---

## 7. Example Conversation Flow (ChatGPT Custom GPT)

1. **Client** calls `tools/list` to learn available operations.
2. Chooses `availability_search`, collects arguments from the user.
3. Calls `tools/call` with structured arguments. Server:
   - Builds CapCorn XML from JSON input.
   - Invokes `RoomAvailability` endpoint with required headers/credentials.
   - Parses XML, maps to JSON, returns:
     ```json
     {
       "content": [
         {
           "type": "text",
           "text": "Found 2 room options for 17–20 Dec 2025."
         }
       ],
       "structuredContent": {
         "rooms": [
           {
             "categoryCode": "DZ",
             "name": "Doppelzimmer mit 1 Zustellbett",
             "totalPrice": 675,
             "currency": "EUR",
             "board": "breakfast",
             "nights": 3
           }
         ],
         "sourceRequestId": "capcorn-9100-20251217"
       }
     }
     ```
4. GPT formats the structured data in its response to the user.
5. If the user confirms booking, GPT calls `create_reservation` tool with compiled guest details.

---

## 8. Implementation Checklist for Nexi Engineers

- [ ] Implement `initialize` handler returning accurate capabilities.
- [ ] Design `tools/list` response model with versioning and metadata (owner, category, safety notes).
- [ ] Build `tools/call` executor with:
  - Input validation (AJV)
  - Request signing/headers injection (CapCorn credentials)
  - Timeout, retry logic (per tool configuration)
  - Response parsing to structured JSON + optional raw content blocks
- [ ] Implement error taxonomy (`isError`, `content` explanation, `notifications/logMessage`).
- [ ] Add optional `resources/list` / `resources/read` to expose API documentation snippets or invocation logs when needed.
- [ ] Enforce per-tenant API-key auth at HTTP layer.
- [ ] Instrument progress & latency metrics.

---

## 9. References

- Model Context Protocol Specification 2025-06-18:
  - Base Protocol & Lifecycle: `/specification/2025-06-18/basic/index`
  - Server Features – Tools: `/server/tools`
  - Schema Reference (`Tool`, `ToolCallParams`, `ToolResult`, `ContentBlock`): `/schema`
- CapCorn Hotel API documentation (`docs/03_example_customer_api_documentation.md`)
- Nexi architecture document (`docs/04_nexi_system_architecture.md`)

Use this guide when building new MCP servers or adapting existing client APIs; it should remain the single source of truth for how Nexi translates domain docs into compliant MCP interfaces.

