import type { GenerationStep } from "./generate-blueprint-launcher";

export function GenerationSteps({ steps }: { steps: GenerationStep[] }) {
  if (!steps.length) return null;

  const total = steps.length;
  const completed = steps.filter((step) => step.status === "success" || step.status === "skipped").length;
  const hasError = steps.some((step) => step.status === "error");
  const progressPercent = Math.round((completed / total) * 100);
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - progressPercent / 100);

  return (
    <section className="rounded-[24px] border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/90 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#0f172a]/75 dark:text-white/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-[var(--ui-border)]/60">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="var(--ui-border)" strokeWidth="8" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="var(--color-primary-500)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-sm font-semibold text-[var(--ui-text-primary)]">{progressPercent}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--ui-text-secondary)]">
              Generation timeline
            </span>
            <p className="text-sm text-[var(--ui-text-secondary)]">
              {hasError ? "Review the highlighted step for next actions." : "We’ll redirect to the blueprint canvas once complete."}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)]/60 bg-[var(--ui-surface-muted)]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-primary-500)]" /> Streamed updates
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const statusBadge = getStatusBadge(step.status);
          return (
            <div key={step.id} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${statusBadge.circle}`}
                >
                  {index + 1}
                </span>
                {!isLast ? <span className="mt-1 h-full w-px bg-gradient-to-b from-[var(--ui-border)]/60 to-transparent" /> : null}
              </div>
              <div className={`flex-1 rounded-2xl border border-[var(--ui-border)]/60 p-4 transition ${statusBadge.card}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-semibold ${statusBadge.label}`}>{step.label}</span>
                  <span className={`text-xs font-semibold uppercase tracking-[0.24em] ${statusBadge.status}`}>{statusBadge.text}</span>
                </div>
                {step.detail ? (
                  <p className="mt-2 text-xs text-[var(--ui-text-secondary)]">{step.detail}</p>
                ) : !isFirst ? (
                  <p className="mt-2 text-xs text-[var(--ui-text-secondary)]">Awaiting previous step…</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getStatusBadge(status: GenerationStep["status"]) {
  switch (status) {
    case "active":
      return {
        circle: "border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/10 text-[var(--color-primary-600)]",
        card: "bg-[var(--ui-surface-muted)]/70 shadow-[0_18px_36px_rgba(59,130,246,0.12)]",
        label: "text-[var(--ui-text-primary)]",
        status: "text-[var(--color-primary-600)]",
        text: "In progress",
      };
    case "success":
      return {
        circle: "border-[var(--color-success-500)] bg-[var(--color-success-500)]/10 text-[var(--color-success-600)]",
        card: "bg-[var(--color-success-500)]/5",
        label: "text-[var(--ui-text-primary)]",
        status: "text-[var(--color-success-600)]",
        text: "Completed",
      };
    case "skipped":
      return {
        circle: "border-[var(--ui-border)]/70 bg-[var(--ui-surface-muted)]/50 text-[var(--ui-text-secondary)]",
        card: "bg-[var(--ui-surface)]/70",
        label: "text-[var(--ui-text-secondary)]",
        status: "text-[var(--ui-text-secondary)]",
        text: "Skipped",
      };
    case "error":
      return {
        circle: "border-[var(--color-error-500)] bg-[var(--color-error-500)]/10 text-[var(--color-error-500)]",
        card: "bg-[var(--color-error-500)]/10",
        label: "text-[var(--color-error-600)]",
        status: "text-[var(--color-error-500)]",
        text: "Failed",
      };
    case "pending":
    default:
      return {
        circle: "border-[var(--ui-border)]/70 bg-[var(--ui-surface)]/60 text-[var(--ui-text-secondary)]",
        card: "bg-[var(--ui-surface)]/75",
        label: "text-[var(--ui-text-secondary)]",
        status: "text-[var(--ui-text-secondary)]",
        text: "Pending",
      };
  }
}
