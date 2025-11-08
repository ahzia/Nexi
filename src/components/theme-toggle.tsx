"use client";

import { useTheme } from "@/shared/theme/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useMemo, type ButtonHTMLAttributes } from "react";

type ThemeToggleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function ThemeToggle({ className = "", ...props }: ThemeToggleProps) {
  const { effectiveTheme, toggleTheme } = useTheme();

  const Icon = useMemo(() => (effectiveTheme === "dark" ? Sun : Moon), [
    effectiveTheme,
  ]);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text-secondary)] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] hover:text-[var(--ui-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-500)] ${className}`}
      {...props}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );
}

