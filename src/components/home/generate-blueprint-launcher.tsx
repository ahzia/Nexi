"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { GenerationSteps } from "@/components/home/generation-steps";
import { Modal } from "@/components/ui/modal";

export type StepStatus = "pending" | "active" | "success" | "error" | "skipped";
export type GenerationStepId = "validate" | "refine" | "assemble" | "redirect";
export interface GenerationStep {
  id: GenerationStepId;
  label: string;
  status: StepStatus;
  detail?: string;
}

function createInitialSteps(): GenerationStep[] {
  return [
    { id: "validate", label: "Validating input", status: "pending" },
    { id: "refine", label: "Generating specification (AI fallback)", status: "pending" },
    { id: "assemble", label: "Building MCP blueprint", status: "pending" },
    { id: "redirect", label: "Opening blueprint workspace", status: "pending" },
  ];
}

export function GenerateBlueprintLauncher() {
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
        className="inline-flex items-center gap-3 rounded-2xl bg-[var(--ui-button-primary)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-md)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)]"
      >
        Generate MCP Blueprint
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
        title="Create MCP Blueprint"
        description="Paste OpenAPI JSON/YAML or free-form documentation. We'll convert it into a workable MCP tool set."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste API docs, OpenAPI schema, or describe the endpoints you need..."
            className="min-h-[260px] w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-4 font-mono text-sm leading-6 text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-400)] focus-visible:ring-offset-2"
            spellCheck={false}
          />

          {shouldShowSteps ? (
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-4">
              <GenerationSteps steps={steps} />
            </div>
          ) : null}

          {error ? <p className="text-sm text-[var(--color-error-500)]">{error}</p> : null}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (!isSubmitting) {
                  setOpen(false);
                  setError(null);
                  resetProgress();
                }
              }}
              className="rounded-xl border border-[var(--ui-border)] px-4 py-2 text-sm text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !input.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--ui-button-primary)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--ui-text-inverse)] shadow-[var(--ui-shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-button-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Working…" : "Generate"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
