"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        try {
          await supabaseBrowser().auth.signOut();
        } catch {}
        router.push("/admin/login");
        router.refresh();
      }}
      aria-label="Sign out"
      title="Sign out"
      className="tap inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface/60 px-3 text-sm font-semibold text-ink transition-colors hover:border-accent sm:px-4"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" />
      </svg>
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
