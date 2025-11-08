"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10">
      <div
        className={cn(
          "relative w-full max-w-3xl rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 shadow-[var(--ui-shadow-xl)]",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-sm text-[var(--ui-text-secondary)] transition hover:text-[var(--ui-text-primary)]"
          aria-label="Close dialog"
        >
          ✕
        </button>
        {(title || description) && (
          <header className="mb-6 flex flex-col gap-2">
            {title ? <h2 className="text-xl font-semibold text-[var(--ui-text-primary)]">{title}</h2> : null}
            {description ? <p className="text-sm text-[var(--ui-text-secondary)]">{description}</p> : null}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
