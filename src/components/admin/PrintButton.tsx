"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="tap inline-flex items-center rounded-[var(--radius-md)] bg-accent px-5 font-bold text-white"
    >
      Print / Save as PDF
    </button>
  );
}
