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
      className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-2 text-sm text-muted hover:text-ink"
    >
      Sign out
    </button>
  );
}
