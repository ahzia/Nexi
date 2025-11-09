import { BlueprintCard } from "@/components/blueprints/BlueprintCard";
import { listToolBlueprints } from "@/lib/data/tool-blueprints";
import Link from "next/link";
import { ArrowRight, Box, PlusCircle } from "lucide-react";

export async function BlueprintGallery() {
  const blueprints = await listToolBlueprints(12);

  if (!blueprints.length) {
    return (
      <section className="gradient-border">
        <div className="glass-surface relative rounded-[30px] p-10">
          <div className="absolute -top-14 right-10 hidden h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.16),transparent_70%)] blur-2xl md:block" />
          <div className="flex flex-col items-start gap-4 text-[var(--ui-text-primary)]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)]/50 bg-[var(--ui-surface)]/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-[var(--ui-text-secondary)]">
              MCP canvas hub
            </span>
            <h2 className="max-w-xl text-3xl font-semibold">No blueprints saved yet—start from a guided template.</h2>
            <p className="max-w-2xl text-sm text-[var(--ui-text-secondary)]">
              Generate a draft from API docs, remix the canvas, and publish an MCP endpoint. Your recent work will appear here for quick access.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-button-primary)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-inverse)] shadow-[0_14px_30px_rgba(59,130,246,0.32)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)]"
              >
                <PlusCircle className="h-4 w-4" />
                Start new blueprint
              </Link>
              <Link
                href="https://modelcontextprotocol.io/specification/latest"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-surface-muted)]/70 hover:text-[var(--ui-text-primary)]"
              >
                <Box className="h-4 w-4" />
                Explore sample
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="gradient-border">
      <div className="glass-surface relative rounded-[32px] p-10">
        <div className="absolute -top-20 left-12 hidden h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18),transparent_70%)] blur-3xl lg:block" />
        <div className="flex flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--ui-text-secondary)]">
                Recently saved
              </span>
              <h2 className="text-xl font-semibold text-[var(--ui-text-primary)]">Tool blueprints</h2>
            </div>
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-surface-muted)]/70 hover:text-[var(--ui-text-primary)]"
            >
              View all blueprints
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <div className="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {blueprints.map((blueprint) => (
              <BlueprintCard key={blueprint.id} blueprint={blueprint} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
