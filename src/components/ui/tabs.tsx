"use client";

import { cn } from "@/lib/utils/cn";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: Array<{ value: string; label: string; icon?: React.ReactNode; badge?: string; hint?: string }>;
  className?: string;
}

export function Tabs({ value, onValueChange, tabs, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-full border border-[var(--ui-border)]/70 bg-[var(--ui-surface)]/80 p-1 shadow-[0_14px_30px_rgba(15,23,42,0.12)] backdrop-blur md:gap-3",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onValueChange(tab.value)}
          className={cn(
            "group inline-flex min-h-[44px] items-center gap-3 rounded-full px-5 py-2 text-sm font-medium transition",
            value === tab.value
              ? "bg-[var(--ui-surface)] text-[var(--ui-text-primary)] shadow-[0_12px_28px_rgba(15,23,42,0.16)]"
              : "text-[var(--ui-text-secondary)] hover:-translate-y-0.5 hover:text-[var(--ui-text-primary)]",
          )}
        >
          {tab.icon ? <span className="text-[var(--ui-text-secondary)] group-hover:text-[var(--ui-text-primary)]">
            {tab.icon}
          </span> : null}
          <span className="whitespace-nowrap">{tab.label}</span>
          {tab.badge ? (
            <span className="rounded-full bg-[var(--ui-border)] px-2 py-0.5 text-xs text-[var(--ui-text-secondary)]">
              {tab.badge}
            </span>
          ) : null}
          {tab.hint ? (
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--ui-text-secondary)] lg:inline">
              {tab.hint}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
