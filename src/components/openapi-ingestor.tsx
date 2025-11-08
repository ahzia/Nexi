import { useState, useTransition } from "react";

import type { ToolDraft } from "@/lib/types/tooling";

interface ApiResponse {
  tools: Array<
    Omit<
      ToolDraft,
      "rawOperation"
    >
  >;
  warnings: {
    id: string;
    level: "info" | "warning";
    message: string;
    operationId?: string;
  }[];
  error?: string;
}

const exampleOpenApi = `openapi: 3.0.0
info:
  title: Demo Availability API
  version: 1.0.0
paths:
  /availability:
    post:
      summary: Search room availability
      description: |
        Query availability for a hotel stay. This mirrors the CapCorn example we received in the docs.
      operationId: searchAvailability
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - hotelId
                - arrivalDate
                - departureDate
              properties:
                hotelId:
                  type: string
                arrivalDate:
                  type: string
                  format: date
                departureDate:
                  type: string
                  format: date
      responses:
        "200":
          description: Availability response
          content:
            application/json:
              schema:
                type: object
                properties:
                  rooms:
                    type: array
                    items:
                      type: object
                      properties:
                        categoryCode:
                          type: string
                        price:
                          type: number
                          format: float
                        currency:
                          type: string
`;

export function OpenApiIngestor() {
  const [source, setSource] = useState<string>(exampleOpenApi);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/openapi/ingest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ source, sourceName: "inline" }),
        });

        const json = (await res.json()) as ApiResponse;
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to ingest OpenAPI document");
        }
        setResult(json);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-[var(--ui-text-primary)]">
          Paste OpenAPI JSON/YAML
        </h2>
        <p className="text-sm text-[var(--ui-text-secondary)]">
          We validate and convert each operation into a draft MCP tool you can later refine in the canvas (as outlined in our architecture docs). The sample below mirrors the CapCorn availability endpoint.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-3">
          <textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="min-h-[420px] w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-4 font-mono text-sm leading-6 text-[var(--ui-text-primary)] shadow-[var(--ui-shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
            spellCheck={false}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ui-button-primary)] px-4 py-2 text-sm font-medium uppercase tracking-wide text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-sm)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Processing…" : "Generate draft tools"}
            </button>
            <p className="text-xs text-[var(--ui-text-secondary)]">
              Tip: replace the sample with your own OpenAPI document to try another API.
            </p>
          </div>
          {error ? (
            <div className="rounded-xl border border-[var(--color-error-500)]/40 bg-[var(--color-error-500)]/10 px-4 py-3 text-sm text-[var(--color-error-500)]">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
            Draft output
          </h3>
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/30 p-4 shadow-[var(--ui-shadow-sm)]">
            {result ? (
              <>
                <WarningsList warnings={result.warnings} />
                <ToolsList tools={result.tools} />
              </>
            ) : (
              <p className="text-sm text-[var(--ui-text-secondary)]">
                Submit the form to see generated MCP tool drafts, including derived input/output schemas. These will be saved to Supabase and surfaced in the canvas in the next implementation step.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WarningsList({ warnings }: { warnings: ApiResponse["warnings"] }) {
  if (!warnings.length) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-warning-500)]/40 bg-[var(--color-warning-500)]/10 p-3 text-sm text-[var(--color-warning-600)]">
      <span className="text-xs font-semibold uppercase tracking-[0.32em]">
        Warnings
      </span>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning.id}>
            {warning.message}
            {warning.operationId ? (
              <span className="ml-2 rounded bg-[var(--ui-surface)] px-2 py-0.5 text-xs text-[var(--ui-text-secondary)]">
                {warning.operationId}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToolsList({ tools }: { tools: ApiResponse["tools"] }) {
  if (!tools.length) {
    return <p className="text-sm text-[var(--ui-text-secondary)]">No tools generated yet.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {tools.map((tool) => (
        <article
          key={tool.id}
          className="flex flex-col gap-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 shadow-sm"
        >
          <header className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-[var(--ui-text-primary)]">{tool.name}</h4>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                {tool.method.toUpperCase()} · {tool.path}
              </p>
            </div>
            {tool.tags.length ? (
              <div className="flex flex-wrap gap-1">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-2 py-0.5 text-xs text-[var(--ui-text-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>
          <p className="text-sm text-[var(--ui-text-secondary)]">{tool.description}</p>
          <details className="rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-3 text-xs text-[var(--ui-text-secondary)]">
            <summary className="cursor-pointer font-semibold text-[var(--ui-text-primary)]">Input schema</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {JSON.stringify(tool.inputSchema, null, 2)}
            </pre>
          </details>
          {tool.outputSchema ? (
            <details className="rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-3 text-xs text-[var(--ui-text-secondary)]">
              <summary className="cursor-pointer font-semibold text-[var(--ui-text-primary)]">
                Output schema
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {JSON.stringify(tool.outputSchema, null, 2)}
              </pre>
            </details>
          ) : null}
        </article>
      ))}
    </div>
  );
}

