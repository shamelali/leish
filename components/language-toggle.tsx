"use client";

import { useLanguage } from "@/lib/i18n/language-context";

export function LanguageToggle() {
  const { setLang, isEnglish } = useLanguage();

  return (
    <div className="flex items-center gap-2">
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
