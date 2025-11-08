import { ThemeToggle } from "@/components/theme-toggle";
import { OpenApiIngestor } from "@/components/openapi-ingestor";
import { BlueprintGallery } from "@/components/blueprint-gallery";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col text-[var(--ui-text-primary)] bg-[var(--ui-background)]">
      <header className="sticky top-0 z-20 border-b border-[var(--ui-border)] bg-[var(--ui-surface)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--ui-surface)]/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] text-white shadow-lg">
              <span className="text-lg font-semibold">NX</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-[var(--ui-text-primary)]">
                Nexi Studio
              </span>
              <span className="text-xs text-[var(--ui-text-secondary)]">
                MCP Builder Design System
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 pb-20 pt-14">
        <section className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-1 text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-primary-600)] shadow-sm">
              Step 1 · Ingest
            </span>
            <h1 className="text-balance text-4xl font-semibold leading-tight text-[var(--ui-text-primary)] md:text-5xl">
              Import an OpenAPI spec and preview MCP tools instantly.
            </h1>
            <p className="max-w-2xl text-pretty text-lg text-[var(--ui-text-secondary)]">
              Paste JSON or YAML, upload docs, and Nexi converts operations into draft MCP tools you can refine in the canvas. This mirrors the flow we mapped in our architecture docs.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--ui-button-primary)] px-5 py-3 text-sm font-medium uppercase tracking-wide text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-md)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                href="https://modelcontextprotocol.io/specification/latest"
                target="_blank"
                rel="noreferrer"
              >
                MCP Spec
              </a>
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-button-secondary)] px-5 py-3 text-sm font-medium text-[var(--ui-text-primary)] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                href="https://github.com/OAI/OpenAPI-Specification"
                target="_blank"
                rel="noreferrer"
              >
                OpenAPI Reference
              </a>
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-[var(--ui-shadow-lg)]">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-500)]/12 via-transparent to-[var(--color-primary-700)]/10" />
            <div className="relative flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-[var(--ui-text-primary)]">What happens next?</h2>
              <ul className="flex list-disc flex-col gap-4 pl-6 text-sm text-[var(--ui-text-secondary)]">
                <li>We parse & dereference your spec using the ingestion service you can now try below.</li>
                <li>Draft tools appear in the canvas for manual tuning (coming up next in the implementation).</li>
                <li>On publish, Nexi generates an MCP endpoint ready for ChatGPT or Claude connection.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-[var(--ui-shadow-md)]">
          <OpenApiIngestor />
        </section>

        <BlueprintGallery />
      </main>
    </div>
  );
}
