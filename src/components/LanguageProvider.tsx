"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  LANGUAGE_STORAGE_KEY,
  SERVICE_TRANSLATIONS,
  TRANSLATIONS,
  type Lang,
  type Translations,
} from "@/lib/translations";
import { PHONE_DISPLAY, PHONE_SMS, PHONE_TEL } from "@/lib/site-config";
import { DEFAULT_PARTS } from "@/lib/content-schema";
import type { SiteContent } from "@/lib/content";

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  serviceTranslations: SiteContent["serviceTranslations"];
  contact: SiteContent["contact"];
  parts: SiteContent["parts"];
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageState | null>(null);

// Operator-edited copy from /admin/website. The homepage wraps itself in
// <SiteContentProvider>; anywhere without one falls back to the code defaults.
const DEFAULT_CONTENT: SiteContent = {
  translations: TRANSLATIONS,
  serviceTranslations: SERVICE_TRANSLATIONS,
  contact: { display: PHONE_DISPLAY, tel: PHONE_TEL, sms: PHONE_SMS },
  parts: DEFAULT_PARTS,
};
const SiteContentContext = createContext<SiteContent>(DEFAULT_CONTENT);

export function SiteContentProvider({
  content,
  children,
}: {
  content: SiteContent;
  children: React.ReactNode;
}) {
  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
}

/**
 * Homepage copy is server-rendered in English, so `lang` must also default
 * to "en" on the client's first render — matching what the server sent —
 * and only switch to a saved preference after mount, inside useEffect.
 * Reading localStorage in the useState initializer instead would make the
 * client's first render diverge from the server's, which React flags as a
 * hydration mismatch.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      // Intentional: one-time sync from an external store (localStorage)
      // that isn't readable during SSR, so it can only happen post-mount.
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "en" || saved === "es") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLangState(saved);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — stay on default.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // ignore — preference just won't persist across visits
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "es" : "en");
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  const content = useContext(SiteContentContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  const { lang } = ctx;
  return useMemo<LanguageContextValue>(
    () => ({
      ...ctx,
      t: content.translations[lang],
      serviceTranslations: content.serviceTranslations,
      contact: content.contact,
      parts: content.parts,
    }),
    [ctx, content, lang],
  );
}
