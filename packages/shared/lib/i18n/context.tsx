"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import type { Language } from "./translations"
import { translations } from "./translations"

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  isEnglish: boolean
}

const STORAGE_KEY = "leish:lang"

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function setDocumentLanguage(lang: Language) {
  if (typeof document === "undefined") return
  document.documentElement.lang = lang === "ms" ? "ms-MY" : "en"
}

function getInitialLang(): Language {
  if (typeof window === "undefined") return "en"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "ms" ? "ms" : "en"
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang)

  useEffect(() => {
    setDocumentLanguage(lang)
  }, [lang])

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const newLang = e.detail as Language
      if (newLang !== lang) setLangState(newLang)
    }
    window.addEventListener("leish:lang-changed", handler as EventListener)
    return () => window.removeEventListener("leish:lang-changed", handler as EventListener)
  }, [lang])

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, newLang)
      setDocumentLanguage(newLang)
      window.dispatchEvent(new CustomEvent("leish:lang-changed", { detail: newLang }))
    }
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, isEnglish: lang === "en" }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    return { lang: "en" as Language, setLang: () => {}, isEnglish: true }
  }
  return context
}

export function useTranslation() {
  const { lang, isEnglish } = useLanguage()
  return { lang, isEnglish, t: translations[lang] }
}
