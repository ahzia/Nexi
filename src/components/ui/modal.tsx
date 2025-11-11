"use client";

import { useEffect } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!mounted || !open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[rgba(8,14,26,0.78)] backdrop-blur-sm" />
      <div
        className={cn(
          "relative z-10 w-full max-w-5xl rounded-[28px] border border-[var(--ui-border)]/70 bg-[var(--ui-surface)] shadow-[0_40px_90px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[#0b1528]",
          className,
        )}
      >
        <div className="max-h-[85vh] overflow-y-auto rounded-[27px] p-10">
          <button
            type="button"
            onClick={onClose}
            className="sticky top-0 ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--ui-border)]/70 bg-[var(--ui-surface)]/80 text-sm text-[var(--ui-text-secondary)] backdrop-blur hover:-translate-y-0.5 hover:text-[var(--ui-text-primary)]"
            aria-label="Close dialog"
          >
            ✕
          </button>
          {(title || description) && (
            <header className="mb-8 flex flex-col gap-2">
              {title ? <h2 className="text-2xl font-semibold text-[var(--ui-text-primary)]">{title}</h2> : null}
              {description ? <p className="text-sm text-[var(--ui-text-secondary)]">{description}</p> : null}
            </header>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
