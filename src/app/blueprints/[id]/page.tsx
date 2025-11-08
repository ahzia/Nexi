import Link from "next/link";
import { notFound } from "next/navigation";

import { getToolBlueprint } from "@/lib/data/tool-blueprints";

interface BlueprintPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BlueprintPage({ params }: BlueprintPageProps) {
  const { id } = await params;
  const blueprint = await getToolBlueprint(id);

  if (!blueprint) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14 text-[var(--ui-text-primary)]">
      <header className="flex flex-col gap-3">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-1 text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-primary-600)] shadow-sm transition hover:-translate-y-0.5"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-semibold">{blueprint.label}</h1>
        <p className="text-sm text-[var(--ui-text-secondary)]">
          {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
            new Date(blueprint.created_at),
          )}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--ui-text-secondary)]">
          <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1">
            {blueprint.tools.length} tool entries
          </span>
          {blueprint.warnings.length ? (
            <span className="rounded-full border border-[var(--color-warning-500)]/40 bg-[var(--color-warning-500)]/10 px-3 py-1 text-[var(--color-warning-600)]">
              {blueprint.warnings.length} warnings
            </span>
          ) : null}
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-4 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)]">
          <h2 className="text-lg font-semibold">Tool drafts</h2>
          <p className="text-sm text-[var(--ui-text-secondary)]">
            These are the operations extracted from your specification. The next milestone will present them within the
            visual canvas editor where you can tweak schemas, add custom logic, and publish to MCP.
          </p>
          <div className="flex flex-col gap-3">
            {blueprint.tools.map((tool) => (
              <article key={tool.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/30 p-4">
                <header className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--ui-text-primary)]">{tool.name}</h3>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                      {tool.method.toUpperCase()} · {tool.path}
                    </p>
                  </div>
                  {tool.tags.length ? (
                    <div className="flex flex-wrap gap-1">
                      {tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-0.5 text-xs text-[var(--ui-text-secondary)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </header>
                <p className="mt-2 text-sm text-[var(--ui-text-secondary)]">{tool.description}</p>
                <details className="mt-3 rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)]/60 p-3 text-xs text-[var(--ui-text-secondary)]">
                  <summary className="cursor-pointer font-semibold text-[var(--ui-text-primary)]">Input schema</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {JSON.stringify(tool.inputSchema, null, 2)}
                  </pre>
                </details>
                {tool.outputSchema ? (
                  <details className="mt-3 rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)]/60 p-3 text-xs text-[var(--ui-text-secondary)]">
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
        </div>

        <aside className="flex flex-col gap-4 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-md)]">
          <h2 className="text-lg font-semibold">Source specification</h2>
          <p className="text-sm text-[var(--ui-text-secondary)]">
            Full OpenAPI document stored with the blueprint. This will feed both the canvas and the MCP runtime.
          </p>
          <pre className="max-h-[540px] overflow-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-4 text-xs leading-6 text-[var(--ui-text-secondary)]">
            {blueprint.raw_spec ?? "No source document stored."}
          </pre>
          {blueprint.warnings.length ? (
            <div className="rounded-2xl border border-[var(--color-warning-500)]/40 bg-[var(--color-warning-500)]/10 p-4 text-xs text-[var(--color-warning-600)]">
              <h3 className="mb-2 font-semibold">Warnings</h3>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {blueprint.warnings.map((warning) => (
                  <li key={warning.id}>
                    {warning.message}
                    {warning.operationId ? (
                      <span className="ml-2 rounded bg-[var(--ui-surface)] px-2 py-0.5 text-[var(--ui-text-secondary)]">
                        {warning.operationId}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

