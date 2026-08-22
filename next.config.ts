import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare Workers can optimize images via an `images` binding, but
    // that adds paid-tier setup. This site only has a handful of JPGs
    // (hero, gallery, before/after), so skip Next's image optimizer and
    // serve originals as-is — simplest path to stay on the free tier.
    unoptimized: true,
  },
};

export default nextConfig;

// Enables `getCloudflareContext()` / Cloudflare bindings during `next dev`.
// No-op in production (the Worker runtime provides bindings natively there).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
