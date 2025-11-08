import Link from "next/link";

import { listToolBlueprints } from "@/lib/data/tool-blueprints";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function BlueprintGallery() {
  const blueprints = await listToolBlueprints(6);

  if (!blueprints.length) {
    return (
      <div className="rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-[var(--ui-shadow-md)]">
        <h2 className="text-lg font-semibold text-[var(--ui-text-primary)]">Saved blueprints</h2>
        <p className="mt-2 text-sm text-[var(--ui-text-secondary)]">
          You haven&apos;t saved any MCP tool drafts yet. Try importing a spec above and saving the result.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-[var(--ui-shadow-md)]">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--ui-text-secondary)]">
          Recently saved
        </span>
        <h2 className="text-lg font-semibold text-[var(--ui-text-primary)]">Tool blueprints</h2>
      </header>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {blueprints.map((blueprint) => (
          <Link
            key={blueprint.id}
            href={`/blueprints/${blueprint.id}`}
            className="flex flex-col gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/30 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)]"
          >
            <header className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--ui-text-primary)]">{blueprint.label}</h3>
                <p className="text-xs text-[var(--ui-text-secondary)]">{formatDate(blueprint.created_at)}</p>
              </div>
              <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1 text-xs text-[var(--ui-text-secondary)]">
                {blueprint.tools.length} tools
              </span>
            </header>
            <div className="flex flex-col gap-2 text-xs text-[var(--ui-text-secondary)]">
              {blueprint.tools.slice(0, 3).map((tool) => (
                <div key={tool.id} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2">
                  <p className="font-semibold text-[var(--ui-text-primary)]">{tool.name}</p>
                  <p className="uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
                    {tool.method.toUpperCase()} · {tool.path}
                  </p>
                </div>
              ))}
              {blueprint.tools.length > 3 ? (
                <p className="text-[var(--ui-text-secondary)]">+ {blueprint.tools.length - 3} more…</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
