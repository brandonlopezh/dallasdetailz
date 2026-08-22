"use client";

import { useState } from "react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Do you really come to me?",
    a: "Yes, we're fully mobile. We bring everything to your home or office anywhere in DFW. Just tell us where to park.",
  },
  {
    q: "Do you need water and power access?",
    a: "Ideally yes, an outdoor spigot and a standard outlet make things easiest. No water or power? Let us know when you book and we'll bring our own setup where possible.",
  },
  {
    q: "How long does a detail take?",
    a: "Depends on the vehicle and package. An exterior on a mid-size truck runs about 75 minutes; a full detail on a large SUV can take 3-4 hours. Your exact time shows before you confirm.",
  },
  {
    q: "What if it rains?",
    a: "We watch the forecast and flag rain risk on your booking. If the weather won't cooperate, we'll reach out to reschedule. No charge, no hassle.",
  },
  {
    q: "How do I pay?",
    a: "We accept Zelle and Cash only. Prices shown are final, no deposit required to book.",
  },
  {
    q: "What areas do you serve?",
    a: "Duncanville, Cedar Hill, DeSoto, Grand Prairie, Dallas, and the greater DFW metro, including areas near 75249.",
  },
  {
    q: "How fast do we reply?",
    a: "We're still in high school, so we'll ideally reply before 8 AM and after 4 PM. Please bear with us!",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-[var(--radius-md)] border border-border bg-surface">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              className="tap flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
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
