import { ThemeToggle } from "@/components/theme-toggle";
import { BlueprintGallery } from "@/components/blueprint-gallery";
import { GenerateBlueprintLauncher } from "@/components/home/generate-blueprint-launcher";
import { HeroShowcase } from "@/components/home/hero-showcase";
import Link from "next/link";
import { CalendarRange, ExternalLink, PlayCircle, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--ui-border)]/70 bg-[var(--ui-surface)]/80 backdrop-blur-xl shadow-[0_2px_24px_rgba(15,23,42,0.08)] transition-all duration-300 supports-[backdrop-filter]:bg-[var(--ui-surface)]/70 dark:border-[var(--ui-border)]/50 dark:shadow-[0_2px_22px_rgba(2,6,23,0.45)]">
        <div className="flex w-full items-center justify-between gap-4 py-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ui-border)]/60 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] text-white shadow-[0_20px_40px_rgba(59,130,246,0.25)] dark:border-white/20">
              <span className="text-lg font-semibold tracking-tight">NX</span>
              <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-[var(--ui-text-primary)]">
                Nexi Studio
              </span>
              <span className="text-xs uppercase tracking-[0.28em] text-[var(--ui-text-secondary)]">
                Agent MCP Orchestrator
              </span>
            </div>
            <div className="ml-4 hidden items-center gap-2 rounded-full border border-[var(--ui-border)]/70 bg-[var(--ui-surface-muted)]/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] lg:inline-flex dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
              <Sparkles className="h-3 w-3" />
              Hackathon build · v0.1.0
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="https://modelcontextprotocol.io/specification/latest"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-full border border-[var(--ui-border)]/70 bg-[var(--ui-surface)]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-surface-muted)]/70 hover:text-[var(--ui-text-primary)] sm:inline-flex dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
            >
              Release notes
              <ExternalLink className="h-3 w-3" />
            </Link>
            <ThemeToggle className="shadow-[var(--ui-shadow-sm)]" />
            <Link
              href="#book-demo"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-button-primary)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-inverse)] shadow-[0_14px_30px_rgba(59,130,246,0.32)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)]"
            >
              Book a demo
              <CalendarRange className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative flex w-full flex-1 flex-col gap-12 pb-20 pt-12">
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
              endpoint ready for your favorite chat agents.
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
              <div className="relative">
                <HeroShowcase />
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-10 bottom-0 h-20 translate-y-1/2 rounded-[30px] bg-gradient-to-b from-transparent via-[var(--ui-background-muted)]/65 to-transparent blur-3xl dark:via-[#0b1220]/60" />
        </section>

        <div className="flex flex-col gap-6" id="gallery">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] border border-[var(--ui-border)]/70 bg-[var(--ui-surface)]/80 px-6 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#0f172a]/70">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.32em] text-[var(--ui-text-secondary)]">Activity snapshot</span>
              <h3 className="text-lg font-semibold text-[var(--ui-text-primary)]">Blueprint momentum</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-success-500)]/50 bg-[var(--color-success-500)]/10 px-3 py-1 text-[var(--color-success-600)]">
                12 tools generated
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-500)]/50 bg-[var(--color-primary-500)]/10 px-3 py-1 text-[var(--color-primary-600)]">
                3 MCP publishes
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-warning-500)]/50 bg-[var(--color-warning-500)]/10 px-3 py-1 text-[var(--color-warning-600)]">
                4 warnings
              </span>
            </div>
          </div>
          <BlueprintGallery />
        </div>
      </main>
    </>
  );
}
