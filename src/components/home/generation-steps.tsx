import type { GenerationStep } from "./generate-blueprint-launcher";

const STATUS_STYLES: Record<GenerationStep["status"], { badge: string; text: string }> = {
  pending: {
    badge: "border-[var(--ui-border)] text-[var(--ui-text-secondary)]",
    text: "text-[var(--ui-text-secondary)]",
  },
  active: {
    badge: "border-[var(--color-primary-500)] text-[var(--color-primary-600)] bg-[var(--color-primary-500)]/10",
    text: "text-[var(--color-primary-600)]",
  },
  success: {
    badge: "border-[var(--color-success-500)] text-[var(--color-success-600)] bg-[var(--color-success-500)]/10",
    text: "text-[var(--color-success-600)]",
  },
  skipped: {
    badge: "border-[var(--ui-border)] text-[var(--ui-text-secondary)] bg-[var(--ui-surface-muted)]/50",
    text: "text-[var(--ui-text-secondary)]",
  },
  error: {
    badge: "border-[var(--color-error-500)] text-[var(--color-error-600)] bg-[var(--color-error-500)]/10",
    text: "text-[var(--color-error-600)]",
  },
};

const STATUS_LABEL: Record<GenerationStep["status"], string> = {
  pending: "Waiting",
  active: "In progress",
  success: "Done",
  skipped: "Skipped",
  error: "Failed",
};

export function GenerationSteps({ steps }: { steps: GenerationStep[] }) {
  if (!steps.length) return null;
  return (
    <ol className="flex flex-col gap-3 text-sm">
      {steps.map((step) => {
        const styles = STATUS_STYLES[step.status];
        return (
          <li key={step.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className={`inline-flex min-w-[7rem] items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${styles.badge}`}>
                {STATUS_LABEL[step.status]}
              </span>
              <span className={`font-medium ${styles.text}`}>{step.label}</span>
            </div>
            {step.detail ? <p className="pl-[calc(7rem+0.75rem)] text-xs text-[var(--ui-text-secondary)]">{step.detail}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
