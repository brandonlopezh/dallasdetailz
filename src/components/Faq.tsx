"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-[var(--radius-md)] border border-border bg-surface">
      {t.faq.items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              className="tap flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-alt"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="font-semibold">{item.q}</span>
              <span
                className={`text-accent transition-transform ${isOpen ? "rotate-45" : ""}`}
                aria-hidden
              >
                ＋
              </span>
            </button>
            {isOpen && (
              <p className="px-5 pb-5 -mt-1 text-muted leading-relaxed">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
