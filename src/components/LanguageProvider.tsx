"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LANGUAGE_STORAGE_KEY, TRANSLATIONS, type Lang } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  t: (typeof TRANSLATIONS)["en"];
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

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
    <LanguageContext.Provider value={{ lang, t: TRANSLATIONS[lang], setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
