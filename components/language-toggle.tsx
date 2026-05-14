"use client";

import { useEffect, useMemo, useState } from "react";

type Language = "en" | "ms";
const STORAGE_KEY = "leish:lang";

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "ms" ? "ms" : "en";
}

function setDocumentLanguage(lang: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang === "ms" ? "ms-MY" : "en";
}

export function LanguageToggle() {
  const [lang, setLang] = useState<Language>(() => getInitialLanguage());

  useEffect(() => {
    setDocumentLanguage(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, lang);
    setDocumentLanguage(lang);

    // Broadcast to any listeners (simple app-wide toggle without introducing full i18n routing).
    window.dispatchEvent(
      new CustomEvent("leish:lang-changed", { detail: lang }),
    );
  }, [lang]);

  const isEnglish = useMemo(() => lang === "en", [lang]);

  return (
    <div className="flex items-center gap-2">
      {/* English Button */}
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`inline-flex h-9 items-center justify-center rounded-full border px-3 font-serif text-xs font-semibold tracking-[-0.01em] transition-colors ${
          isEnglish
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
        }`}
        aria-label="EN - Switch to English"
        title="English"
      >
        EN
      </button>
      {/* Bahasa Melayu Button */}
      <button
        type="button"
        onClick={() => setLang("ms")}
        className={`inline-flex h-9 items-center justify-center rounded-full border px-3 font-serif text-xs font-semibold tracking-[-0.01em] transition-colors ${
          !isEnglish
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
        }`}
        aria-label="BM - Switch to Bahasa Melayu"
        title="Bahasa Melayu"
      >
        BM
      </button>
    </div>
  );
}
