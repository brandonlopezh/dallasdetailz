"use client";

import { useLayoutEffect } from "react";

/**
 * Keeps the light/dark setting where it belongs. Only the admin has a theme
 * toggle; the public site is always dark. The pre-paint script in layout.tsx
 * handles full page loads, but moving between the admin and the site without
 * a reload (a link click, signing out) left the old page's theme on <html>,
 * so the homepage could show up in the admin's light mode. Each side renders
 * this to set the right theme when it appears.
 */
export default function ThemeScope({ scope }: { scope: "public" | "admin" }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    let light = false;
    if (scope === "admin") {
      try {
        const saved = window.localStorage.getItem("dd-theme");
        light = saved === "light" || !saved; // admin starts light until a choice is saved
      } catch {
        light = true;
      }
    }
    if (light) root.dataset.theme = "light";
    else delete root.dataset.theme;
  }, [scope]);
  return null;
}
