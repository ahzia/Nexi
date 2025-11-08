import Link from "next/link";
import { notFound } from "next/navigation";

import { getToolBlueprint } from "@/lib/data/tool-blueprints";
import { BlueprintDetailClient } from "@/components/blueprints/BlueprintDetailClient";

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
          {blueprint.warnings?.length ? (
            <span className="rounded-full border border-[var(--color-warning-500)]/40 bg-[var(--color-warning-500)]/10 px-3 py-1 text-[var(--color-warning-600)]">
              {blueprint.warnings.length} warnings
            </span>
          ) : null}
        </div>
      </header>

      <BlueprintDetailClient blueprint={blueprint} />
    </div>
  );
}

