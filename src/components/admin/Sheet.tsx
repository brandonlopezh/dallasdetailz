"use client";

/**
 * Popup used for admin outcomes ("Request officially booked", customer
 * contact). A bottom sheet on phones, centered card on larger screens.
 * Backdrop tap does nothing on purpose — the person should read it and
 * press the button, since closing it also refreshes the list behind it.
 */
export default function Sheet({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-t-[1.25rem] border border-border bg-base p-6 pb-8 shadow-2xl sm:rounded-[1.25rem]">
        {children}
      </div>
    </div>
  );
}

export function BigButton({
  children,
  href,
  onClick,
  tone = "default",
  external,
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "primary" | "success" | "danger";
  external?: boolean;
  disabled?: boolean;
}) {
  const cls = `tap flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 text-base font-bold disabled:opacity-50 ${
    {
      default: "border border-border bg-surface",
      primary: "bg-accent text-white",
      success: "bg-success text-black",
      danger: "border border-danger/50 text-danger",
    }[tone]
  }`;
  const style = { minHeight: 56 };
  if (href) {
    return (
      <a
        href={href}
        className={cls}
        style={style}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
}
