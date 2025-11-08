import { ThemeToggle } from "@/components/theme-toggle";
import { BlueprintGallery } from "@/components/blueprint-gallery";
import { GenerateBlueprintLauncher } from "@/components/home/generate-blueprint-launcher";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--ui-background)] text-[var(--ui-text-primary)]">
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
              <span className="text-xs text-[var(--ui-text-secondary)]">Agent MCP Orchestrator</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 pb-20 pt-14">
        <section className="grid gap-8 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-[var(--ui-shadow-lg)] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/50 px-4 py-1 text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-primary-600)]">
              Build · Deploy · Demo
            </span>
            <h1 className="text-balance text-4xl font-semibold leading-tight md:text-5xl">
              Turn any API description into a live MCP integration in minutes.
            </h1>
            <p className="max-w-2xl text-pretty text-lg text-[var(--ui-text-secondary)]">
              Drop an OpenAPI spec or paste raw documentation—Nexi will normalize it, scaffold tools, and host an MCP
              endpoint ready for ChatGPT, Claude, and other agents.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <GenerateBlueprintLauncher />
              <a
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--ui-border)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-secondary)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-primary)]"
                href="https://modelcontextprotocol.io/specification/latest"
                target="_blank"
                rel="noreferrer"
              >
                Learn about MCP
              </a>
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-gradient-to-br from-[var(--color-primary-500)]/15 via-transparent to-[var(--color-primary-700)]/15 p-1">
            <div className="flex h-full flex-col justify-between rounded-[26px] bg-[var(--ui-surface)] p-6 text-sm text-[var(--ui-text-secondary)] shadow-[var(--ui-shadow-lg)]">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-primary-500)]">Workflow snapshot</p>
                <ul className="mt-4 space-y-3">
                  <li className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-3">
                    <p className="text-sm font-semibold text-[var(--ui-text-primary)]">1. Parse documentation</p>
                    <p className="text-xs">We dereference OpenAPI or auto-generate it with the MCP assistant.</p>
                  </li>
                  <li className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-3">
                    <p className="text-sm font-semibold text-[var(--ui-text-primary)]">2. Shape MCP tools</p>
                    <p className="text-xs">Each operation becomes a canvas node you can tweak and extend.</p>
                  </li>
                  <li className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-3">
                    <p className="text-sm font-semibold text-[var(--ui-text-primary)]">3. Publish endpoint</p>
                    <p className="text-xs">Instant MCP URL + API key. Share it with your demo agents.</p>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/30 p-4 text-xs leading-6">
                <p className="font-semibold text-[var(--ui-text-primary)]">Need a starting point?</p>
                <p>Kick off with the CapCorn hotel example or your own docs—it’s optimized for hackathon demos.</p>
              </div>
            </div>
          </div>
        </section>

        <BlueprintGallery />
      </main>
    </div>
  );
}
