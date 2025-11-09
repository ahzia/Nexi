"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { GenerationSteps } from "@/components/home/generation-steps";
import { Modal } from "@/components/ui/modal";
import { ArrowRight, DownloadCloud, Info, Lightbulb, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

export type StepStatus = "pending" | "active" | "success" | "error" | "skipped";
export type GenerationStepId = "validate" | "refine" | "assemble" | "redirect";
export interface GenerationStep {
  id: GenerationStepId;
  label: string;
  status: StepStatus;
  detail?: string;
}

interface GenerateBlueprintLauncherProps {
  triggerLabel?: string;
  triggerIcon?: ReactNode;
  className?: string;
}

function createInitialSteps(): GenerationStep[] {
  return [
    { id: "validate", label: "Validating input", status: "pending" },
    { id: "refine", label: "Generating specification (AI fallback)", status: "pending" },
    { id: "assemble", label: "Building MCP blueprint", status: "pending" },
    { id: "redirect", label: "Opening blueprint workspace", status: "pending" },
  ];
}

export function GenerateBlueprintLauncher({
  triggerLabel = "Generate MCP Blueprint",
  triggerIcon,
  className = "",
}: GenerateBlueprintLauncherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<GenerationStep[]>(createInitialSteps);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetProgress = useCallback(() => {
    setSteps(createInitialSteps());
  }, []);

  const setStep = useCallback((id: GenerationStepId, updates: Partial<GenerationStep>) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...updates } : step)),
    );
  }, []);

  const markActiveStepError = useCallback((detail?: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.status === "active"
          ? { ...step, status: "error", detail: detail ?? step.detail }
          : step,
      ),
    );
  }, []);

  const shouldShowSteps = useMemo(
    () => steps.some((step) => step.status !== "pending"),
    [steps],
  );

  const charCount = input.length;
  const lineCount = input ? input.split(/\n/).length : 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    resetProgress();
    setIsSubmitting(true);

    setStep("validate", { status: "active", detail: "Checking that the input is not empty." });
    setStep("validate", { status: "success", detail: undefined });
    setStep("refine", {
      status: "active",
      detail: "Normalising documentation and resolving missing OpenAPI fields.",
    });

    try {
      const response = await fetch("/api/blueprints/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: input }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        markActiveStepError(payload.error);
        throw new Error(payload.error ?? "Failed to generate blueprint");
      }

      const payload: {
        id: string;
        usedModel?: boolean;
        iterations?: number;
        notes?: string[];
        toolCount?: number;
      } = await response.json();

      const iterationCount = payload.iterations ?? 1;

      setStep("refine", {
        status: payload.usedModel ? "success" : "skipped",
        detail: payload.usedModel
          ? `OpenAI refinement completed in ${iterationCount} iteration${iterationCount === 1 ? "" : "s"}.`
          : "Input already matched OpenAPI requirements.",
      });

      setStep("assemble", {
        status: "active",
        detail: "Persisting MCP tools, capabilities, and warnings.",
      });
      setStep("assemble", {
        status: "success",
        detail: payload.toolCount
          ? `Registered ${payload.toolCount} tool${payload.toolCount === 1 ? "" : "s"}.`
          : undefined,
      });

      setStep("redirect", {
        status: "active",
        detail: "Preparing canvas view for review.",
      });

      setOpen(false);
      setInput("");
      setStep("redirect", { status: "success", detail: undefined });
      setIsSubmitting(false);
      resetProgress();

      router.push(`/blueprints/${payload.id}`);
      router.refresh();
    } catch (err) {
      setIsSubmitting(false);
      markActiveStepError((err as Error).message);
      setError((err as Error).message);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
          resetProgress();
        }}
        className={`inline-flex items-center gap-3 rounded-2xl bg-[var(--ui-button-primary)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-md)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] ${className}`}
      >
        {triggerIcon}
        {triggerLabel}
      </button>

      <Modal
        open={open}
        onClose={() => {
          if (!isSubmitting) {
            setOpen(false);
            setError(null);
            resetProgress();
          }
        }}
        title="Blueprint Generator"
        description="Bring raw documentation—we'll validate, refine, and assemble a ready-to-publish MCP blueprint."
      >
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[0.38fr_0.62fr]">
          <aside className="flex flex-col gap-6 rounded-[24px] border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/85 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-500)]/15 text-[var(--color-primary-600)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-primary)]">Guided flow</h3>
                <p className="text-xs text-[var(--ui-text-secondary)]">Follow the steps to craft an agent-ready spec.</p>
              </div>
            </div>
            <ol className="flex flex-col gap-4">
              {[
                {
                  label: "Paste or upload docs",
                  detail: "OpenAPI, XML, or structured markdown.",
                  icon: <UploadCloud className="h-4 w-4" />,
                },
                {
                  label: "Preview summary",
                  detail: "We highlight endpoints and gaps before generation.",
                  icon: <Lightbulb className="h-4 w-4" />,
                },
                {
                  label: "Generate MCP blueprint",
                  detail: "Validated tools, canvas nodes, and publish-ready config.",
                  icon: <ShieldCheck className="h-4 w-4" />,
                },
              ].map((item, index) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--ui-border)]/60 bg-[var(--ui-surface-muted)]/60 text-xs font-semibold text-[var(--color-primary-600)] shadow-sm">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-1 text-sm text-[var(--ui-text-secondary)]">
                    <span className="inline-flex items-center gap-2 font-semibold text-[var(--ui-text-primary)]">
                      {item.icon}
                      {item.label}
                    </span>
                    <span className="text-xs text-[var(--ui-text-secondary)]">{item.detail}</span>
                  </div>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl border border-[var(--ui-border)]/60 bg-[var(--ui-surface-muted)]/70 p-4 text-xs text-[var(--ui-text-secondary)] dark:border-white/15 dark:bg-white/10 dark:text-white/80">
              <p className="flex items-center gap-2 font-semibold text-[var(--ui-text-primary)]">
                <Info className="h-4 w-4" /> Privacy note
              </p>
              <p className="mt-1">
                We securely pass anonymized snippets to OpenAI when refinement is required. No credentials or personal data should be included.
              </p>
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/90 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f172a]/75">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--ui-text-secondary)]">
                    Source material
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--ui-text-primary)]">Paste documentation</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ui-text-secondary)]">
                  <button
                    type="button"
                    onClick={() => {
                      setInput((prev) =>
                        prev ||
                        `openapi: 3.0.0\ninfo:\n  title: CapCorn Demo API\n  version: 1.0.0\npaths:\n  /availability:\n    post:\n      summary: Search room availability\n      operationId: searchAvailability\n      responses:\n        "200":\n          description: ok`,
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-500)]/50 bg-[var(--color-primary-500)]/10 px-3 py-1 font-semibold text-[var(--color-primary-600)] transition hover:-translate-y-0.5"
                  >
                    <DownloadCloud className="h-3.5 w-3.5" />
                    Use sample
                  </button>
                  <a
                    href="https://modelcontextprotocol.io"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/70 px-3 py-1 font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-primary)]"
                  >
                    Format tips
                  </a>
                </div>
              </div>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Paste API docs, OpenAPI schema, or describe the endpoints you need..."
                className="min-h-[240px] w-full rounded-[20px] border border-[var(--ui-border)]/60 bg-[var(--ui-surface-muted)]/50 p-4 font-mono text-sm leading-6 text-[var(--ui-text-primary)] shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
                spellCheck={false}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ui-text-secondary)]">
                <span>{charCount} characters · {lineCount} lines</span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  Supports JSON, YAML, XML, and markdown excerpts
                </span>
              </div>
              {error ? (
                <div className="rounded-2xl border border-[var(--color-error-500)]/50 bg-[var(--color-error-500)]/10 px-4 py-3 text-sm text-[var(--color-error-500)]">
                  {error}
                </div>
              ) : null}
            </div>

            {shouldShowSteps ? (
              <GenerationSteps steps={steps} />
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--ui-border)]/60 bg-[var(--ui-surface-muted)]/60 p-6 text-sm text-[var(--ui-text-secondary)] dark:border-white/15 dark:bg-white/10 dark:text-white/80">
                Progress details appear here once generation begins. You'll see validation logs and AI refinement notes in real time.
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-[20px] border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/85 p-4 text-xs text-[var(--ui-text-secondary)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/10 dark:text-white/75">
              <span className="font-semibold text-[var(--ui-text-primary)]">Nexi will:</span>
              <ul className="list-disc space-y-1 pl-4">
                <li>Validate schema completeness and required credentials.</li>
                <li>Call OpenAI only if structural fixes are needed.</li>
                <li>Persist draft tools, warnings, and canvas layout in Supabase.</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) {
                    setOpen(false);
                    setError(null);
                    resetProgress();
                  }
                }}
                className="rounded-full border border-[var(--ui-border)]/70 bg-[var(--ui-surface)]/70 px-5 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] transition hover:-translate-y-0.5 hover:text-[var(--ui-text-primary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !input.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-button-primary)] px-6 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-inverse)] shadow-[0_16px_34px_rgba(59,130,246,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Generating" : "Generate blueprint"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
