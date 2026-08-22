import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal config: in-memory incremental cache (no R2 bucket needed).
// This site is mostly dynamic (booking/admin, server-priced APIs) with a
// static marketing homepage, so persistent ISR caching isn't required to
// stay on Cloudflare's free tier. Add an R2-backed incremental cache later
// if/when pages start using revalidate-based ISR.
export default defineCloudflareConfig();
