import { BlueprintCard } from "@/components/blueprints/BlueprintCard";
import { listToolBlueprints } from "@/lib/data/tool-blueprints";

export async function BlueprintGallery() {
  const blueprints = await listToolBlueprints(12);

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
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {blueprints.map((blueprint) => (
          <BlueprintCard key={blueprint.id} blueprint={blueprint} />
        ))}
      </div>
    </section>
  );
}
