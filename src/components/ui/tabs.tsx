"use client";

import { cn } from "@/lib/utils/cn";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: Array<{ value: string; label: string; icon?: React.ReactNode; badge?: string }>;
}

export function Tabs({ value, onValueChange, tabs }: TabsProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]/40 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onValueChange(tab.value)}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
            value === tab.value
              ? "bg-[var(--ui-surface)] text-[var(--ui-text-primary)] shadow-[var(--ui-shadow-sm)]"
              : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]",
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge ? (
            <span className="rounded-full bg-[var(--ui-border)] px-2 py-0.5 text-xs text-[var(--ui-text-secondary)]">
              {tab.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
