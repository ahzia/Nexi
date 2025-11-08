import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col text-[var(--ui-text-primary)]">
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
        <section className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-1 text-xs font-medium uppercase tracking-[0.28em] text-[var(--color-primary-600)] shadow-sm">
              Design System
            </span>
            <h1 className="text-balance text-4xl font-semibold leading-tight text-[var(--ui-text-primary)] md:text-5xl">
              A deliberate theme for building trustworthy agent interfaces.
            </h1>
            <p className="max-w-2xl text-pretty text-lg text-[var(--ui-text-secondary)]">
              This project reuses the visual language from our PromptFlow extension—
              calm surfaces, vibrant primary accents, and thoughtful depth cues. Toggle
              themes to preview how dashboards, canvases, and modals should render across
              light and dark environments.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--ui-button-primary)] px-5 py-3 text-sm font-medium uppercase tracking-wide text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-md)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2">
                Explore Builder
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-button-secondary)] px-5 py-3 text-sm font-medium text-[var(--ui-text-primary)] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2">
                View Design Tokens
              </button>
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-[var(--ui-shadow-lg)]">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-500)]/12 via-transparent to-[var(--color-primary-700)]/10" />
            <div className="relative flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-[var(--ui-text-primary)]">
                Token Snapshot
              </h2>
              <div className="grid gap-4">
                <TokenRow label="Surface" value="--ui-surface" swatch="var(--ui-surface)" />
                <TokenRow
                  label="Surface Muted"
                  value="--ui-surface-muted"
                  swatch="var(--ui-surface-muted)"
                />
                <TokenRow
                  label="Border"
                  value="--ui-border"
                  swatch="var(--ui-border)"
                />
                <TokenRow
                  label="Primary"
                  value="--color-primary-500"
                  swatch="var(--color-primary-500)"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card
            title="Surfaces & Depth"
            description="Use layered panels with soft radii, subtle shadows, and translucent borders to imply hierarchy without clutter."
          />
          <Card
            title="Typography"
            description="Geist Sans pairs well with data-heavy layouts; apply medium weight for headings and relaxed leading for descriptive text."
          />
          <Card
            title="Interaction States"
            description="Buttons and inputs lean on vibrant primary accents while respecting contrast in both light and dark contexts."
          />
        </section>
      </main>
    </div>
  );
}

function TokenRow({
  label,
  value,
  swatch,
}: {
  label: string;
  value: string;
  swatch: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/60 p-4 shadow-[var(--ui-shadow-sm)]">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-[var(--ui-text-primary)]">
          {label}
        </span>
        <span className="truncate text-xs uppercase tracking-wide text-[var(--ui-text-secondary)]">
          {value}
        </span>
      </div>
      <span
        className="h-10 w-10 shrink-0 rounded-xl border border-[var(--ui-border-strong)] shadow-inner"
        style={{ background: swatch }}
      />
    </div>
  );
}

function Card({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow-sm)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--ui-shadow-md)]">
      <h3 className="text-lg font-semibold text-[var(--ui-text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--ui-text-secondary)]">{description}</p>
    </article>
  );
}
