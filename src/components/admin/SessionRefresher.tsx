"use client";

import { useEffect } from "react";

// Supabase access tokens default to a ~1hr lifetime. Ping the refresh route
// well under that so an admin working in the dashboard doesn't get bounced
// to /admin/login mid-task. See src/app/api/admin/refresh/route.ts for why
// this exists (replaces what proxy.ts used to do on every /admin request).
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 min

export default function SessionRefresher() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/admin/refresh", { cache: "no-store" }).catch(() => {
        // Best-effort — a missed ping just means the next one (or a full
        // page load, which re-runs getAdminUser() regardless) catches it.
      });
    };
    ping();
    const id = setInterval(ping, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
