# Nexi Codebase Cleanup Notes

This document summarizes the main architectural and clean-code issues observed in the current Nexi codebase and offers recommendations for remediation. The goal is to provide a roadmap for incremental improvements without interrupting ongoing feature work.

---

## 1. Architecture & Layering

- **Blended responsibilities between UI components and data orchestration**  
  Example: `GenerateBlueprintLauncher` encapsulates modal state, API orchestration, and presentation logic in a single file.  
  **Recommendation:** Introduce thin hooks (e.g., `useBlueprintGeneration`) to isolate orchestration from presentation and make the UI components declarative.

- **Runtime helpers scattered across multiple directories**  
  MCP runtime utilities (`http`, `transformers`, `validation`, `xml`, `stream`) live in `src/lib/mcp/*` but share interdependent concepts.  
  **Recommendation:** Group them under a single runtime module that exposes a public surface (`src/lib/mcp/runtime/index.ts`) to clarify entry points and internal helpers.

- **API routes replicate data-layer concerns**  
  Several routes (e.g., `api/blueprints/generate`, `api/mcp/[slug]`) directly manipulate Supabase records rather than delegating to reusable services.  
  **Recommendation:** Create task-specific service modules in `src/lib/services` or expand `src/lib/data` to include higher-level operations (e.g., `BlueprintGenerator`, `McpPublisher`) to keep route handlers thin.

- **OpenAPI ingestion tightly coupled to MCP output**  
  `src/lib/openapi/ingest.ts` mixes parsing, schema cleanup, warning aggregation, and MCP metadata enrichment.  
  **Recommendation:** Break into composable stages (document parsing, schema normalisation, MCP metadata extraction) to enable reuse and easier testing.

---

## 2. Code Quality & Consistency

- **Inconsistent error handling patterns**  
  Some API routes respond with bare `Error.message`, others wrap in structured objects. UI components sometimes expect `error` as a string, other times as a shape.  
  **Recommendation:** Standardise on a response helper (e.g., `createApiError(status, code, details)`) and ensure UI layers always receive structured errors.

- **Verbose string concatenation for logs and messages**  
  Multiple places (e.g., instruction generation) assemble multi-line strings manually.  
  **Recommendation:** Use template literals or utility functions to centralise common text, improving readability and localisation readiness.

- **Manual state machines in components**  
  Complex components maintain multiple boolean states that could be derived (e.g., `isSubmitting`, `steps` states).  
  **Recommendation:** Consider `useReducer` or dedicated state machines (`xstate` or simple reducers) when states become interdependent.

- **Repeated data-shaping logic**  
  Transformations like removing `rawOperation` or normalising tool payloads occur in several modules.  
  **Recommendation:** Add dedicated utility functions in `src/lib/tools` (e.g., `sanitizeToolDraft`, `toRuntimeTool`) to prevent drift.

---

## 3. Testing & Reliability Gaps

- **Limited automated coverage for ingestion & conversion**  
  The JSON↔XML conversion, validation flow, and MCP runtime integration rely on manual curl tests.  
  **Recommendation:** Add unit tests around `serializeXmlBody`, `stripXmlAnnotations`, and `executeHttpTool`, plus a high-level integration test using mocked fetch responses.

- **Missing regression tests for AI fallback**  
  The OpenAI fallback path is critical but untested.  
  **Recommendation:** Abstract the AI calls behind an interface and provide a mocked implementation in tests to simulate retries and failures.

- **No performance guardrails**  
  Larger documentation inputs may cause long-running generation steps without user feedback beyond the new UI progress.  
  **Recommendation:** Add basic logging/metrics (even console + Supabase logs) to monitor generation duration, transformation errors, and MCP call volume.

---

## 4. Developer Experience

- **Lack of documented workflows**  
  Existing docs focus on external APIs but not internal build/test/deploy steps.  
  **Recommendation:** Add `README` sections or new docs covering:
  - local dev bootstrap (env variables, Supabase migration expectations)
  - testing commands and recommended scenarios
  - MCP debugging tips (curl templates, Claude integration steps)

- **Sparse coding conventions**  
  No unified linting/prettier or naming guidelines beyond ESLint defaults.  
  **Recommendation:** Extend lint rules to cover import ordering, naming standards, and enforce consistent hook/component file structures.

- **Manual deployment adjustments**  
  Vercel configuration (root directory, env vars) has caused repeated confusion.  
  **Recommendation:** Document required Vercel settings, or add a postinstall check that warns if `process.env.VERCEL` is set without `MCP_BASE_URL`.

---

## 5. Suggested Next Steps

1. **Stabilise configuration management**  
   - Create a `config` module for environment variables with validation.
   - Ensure all runtime code reads from the same source of truth.

2. **Refactor ingestion pipeline into smaller modules**  
   - Split parsing, validation, and MCP mapping.
   - Add corresponding unit tests.

3. **Introduce service layer abstractions**  
   - Encapsulate Supabase interactions for blueprints, tools, and MCP instances.
   - Allow API routes to focus on request/response concerns.

4. **Adopt stepwise state management in UI**  
   - Extract hooks for complex flows (e.g., generation, publishing).
   - Consider context providers for shared dashboard state.

5. **Improve documentation and tooling**  
   - Expand `/docs` with developer guides and troubleshooting.
   - Automate lint/test checks via pre-push hook or CI.

Addressing these items iteratively will yield a cleaner architecture, clearer responsibilities, and a smoother contributor experience while reducing the risk of regressions as Nexi evolves.

