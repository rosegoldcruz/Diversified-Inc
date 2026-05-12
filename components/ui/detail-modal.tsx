"use client";

import { ReactNode, useEffect, useRef } from "react";

type DetailModalProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function DetailModal({
  title,
  subtitle,
  onClose,
  children,
}: DetailModalProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-borderSubtle bg-surface p-5 shadow-cyberMd"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-borderSubtle pb-3">
          <div>
            <h2
              id="detail-modal-title"
              className="text-lg font-semibold text-textPrimary"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-textMuted">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md border border-borderSubtle bg-surface px-3 py-1.5 text-xs font-medium text-textSecondary transition-colors hover:bg-bgDark hover:text-textPrimary"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-borderSubtle bg-bgDark px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-1 text-sm text-textPrimary">{value}</p>
    </div>
  );
}
