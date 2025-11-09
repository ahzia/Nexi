"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bot, Code, MousePointerClick } from "lucide-react";

const DISCOVERY_SNIPPET = `{
  "version": "2025-06-18",
  "server": {
    "name": "nexi-capcorn"
  },
  "tools": [
    "availability_search",
    "create_reservation",
    "cancel_reservation"
  ]
}`;

const FLOW_STEPS = [
  { id: "parse", label: "Parse docs", accent: "var(--color-primary-500)" },
  { id: "refine", label: "AI refine", accent: "var(--color-accent-500)" },
  { id: "assemble", label: "Assemble tools", accent: "var(--color-success-500)" },
  { id: "publish", label: "Publish MCP", accent: "var(--color-warning-500)" },
];

const STATUS_MESSAGES = [
  "AI refinement complete · 4 tools ready",
  "Blueprint synced to Supabase",
  "Discovery file regenerated",
  "Runtime endpoint healthy",
];

export function HeroShowcase() {
  const [snippetChars, setSnippetChars] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const snippetTimer = setInterval(() => {
      setSnippetChars((prev) => {
        if (prev >= DISCOVERY_SNIPPET.length) {
          return DISCOVERY_SNIPPET.length;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(snippetTimer);
  }, []);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % FLOW_STEPS.length);
    }, 2200);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3200);
    return () => clearInterval(statusTimer);
  }, []);

  const visibleSnippet = useMemo(() => DISCOVERY_SNIPPET.slice(0, snippetChars), [snippetChars]);

  const statusMessage = STATUS_MESSAGES[statusIndex];

  return (
    <div className="relative flex h-full w-full flex-col gap-4">
      <div className="absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(147,197,253,0.35),transparent_65%)] blur-2xl dark:bg-[radial-gradient(circle_at_top,var(--color-primary-500)/18,transparent_60%)]" />
      <div className="absolute inset-0 -z-20 overflow-hidden rounded-[32px]">
        <div className="hero-particle-grid" />
      </div>
      <div className="flex w-full flex-col gap-3 rounded-[28px] border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/85 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
        <div className="flex items-center justify-between text-xs text-[var(--ui-text-secondary)] dark:text-white/80">
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.32em] text-[var(--ui-text-secondary)] dark:text-white/80">
            <Bot className="h-3.5 w-3.5" />
            Flow Timeline
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/70 px-3 py-1 font-medium text-[10px] uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] dark:border-white/10 dark:bg-white/10 dark:text-white/80">
            <Code className="h-3 w-3" />
            React Flow Preview
          </span>
        </div>
        <div className="relative grid gap-2">
          {FLOW_STEPS.map((step, index) => {
            const isActive = index === activeStepIndex;
            return (
              <div
                key={step.id}
                className={`flex items-center justify-between rounded-2xl border border-[var(--ui-border)]/60 px-4 py-3 text-sm transition-all duration-500 ${
                  isActive
                    ? "bg-[var(--ui-surface-muted)]/80 text-[var(--ui-text-primary)] shadow-[0_12px_32px_rgba(15,23,42,0.12)] dark:bg-white/15 dark:text-white"
                    : "bg-[var(--ui-surface)]/70 text-[var(--ui-text-secondary)] dark:bg-white/10 dark:text-white/70"
                }`}
              >
                <span className="font-medium">{step.label}</span>
                <span
                  className="inline-flex h-2 w-12 rounded-full"
                  style={{ backgroundColor: step.accent }}
                />
              </div>
            );
          })}
          <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-[var(--color-primary-400)] via-[var(--color-accent-500)] to-[var(--color-success-500)]" />
        </div>
      </div>

      <div className="relative flex flex-col gap-3 rounded-[28px] border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/85 p-4 text-xs text-[var(--ui-text-secondary)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:text-white/80">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em]">
          <span className="font-semibold">Discovery.mcp.json</span>
          <span className="flex items-center gap-2 rounded-full border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/70 px-3 py-1 text-[10px] text-[var(--ui-text-secondary)] dark:border-white/15 dark:bg-white/10 dark:text-white/75">
            <MousePointerClick className="h-3 w-3" />
            live preview
          </span>
        </div>
        <pre className="max-h-[200px] overflow-hidden whitespace-pre-wrap break-words rounded-2xl border border-[var(--ui-border)]/60 bg-[var(--ui-surface-muted)]/70 p-4 font-mono text-[11px] leading-6 text-[var(--ui-text-secondary)] shadow-inner dark:border-white/10 dark:bg-black/40 dark:text-white/80">
          {visibleSnippet}
          {snippetChars < DISCOVERY_SNIPPET.length ? "▍" : ""}
        </pre>
      </div>

      <div className="flex items-center justify-between rounded-full border border-[var(--ui-border)]/60 bg-[var(--ui-surface)]/85 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white/80">
        <span className="inline-flex items-center gap-2">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {statusMessage}
        </span>
        <span className="rounded-full bg-[var(--ui-surface-muted)]/70 px-2 py-0.5 text-[10px] text-[var(--ui-text-secondary)] dark:bg-white/15 dark:text-white/80">
          Realtime sync
        </span>
      </div>
    </div>
  );
}

export default HeroShowcase;
