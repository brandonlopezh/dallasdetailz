import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development only. `next dev` refuses its scripts to any address other
  // than localhost, so opening the site from a phone (or this computer's
  // network address, e.g. http://192.168.1.20:3000) gave a page that looked
  // right but where no button or link responded. This allows devices on the
  // home/office network. It has no effect on the deployed site.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
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
