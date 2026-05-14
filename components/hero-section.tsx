"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n/language-context"

export function HeroSection() {
  const { t, lang } = useTranslation()
  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 sm:px-6 lg:flex-row lg:px-8">
        {/* Text content */}
        <div className="flex flex-1 flex-col items-start justify-center py-12 sm:py-20 lg:py-32">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-accent">
            {t.hero.luxuryMarketplace}
          </p>
          <h1 className="mt-4 sm:mt-6 font-serif text-3xl sm:text-5xl font-semibold leading-[1.05] sm:leading-[1.02] tracking-[-0.03em] sm:tracking-[-0.04em] text-foreground md:text-6xl lg:text-7xl">
            <span className="text-balance">{t.hero.title}</span>
          </h1>
          <p className="mt-4 sm:mt-6 max-w-md text-sm sm:text-base leading-relaxed text-muted-foreground">
            {t.hero.subtitle}
          </p>
          <div className="mt-6 sm:mt-10 flex flex-col gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/artists"
              className="group flex items-center justify-center gap-2 rounded-full bg-foreground px-6 sm:px-8 py-3 sm:py-3.5 font-serif text-sm font-semibold tracking-[-0.01em] text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground"
            >
              {t.hero.ctaBrowse}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
               <Link
                 href="/quiz"
                 className="flex items-center justify-center rounded-full border border-foreground px-6 sm:px-8 py-3 sm:py-3.5 font-serif text-sm font-semibold tracking-[-0.01em] text-foreground transition-all hover:bg-foreground hover:text-primary-foreground"
               >
                 {lang === "ms" ? "Kwiz Kecantikan" : "Match!"}
               </Link>
              <Link
                href="/artists"
                className="flex items-center justify-center rounded-full border border-border px-6 sm:px-8 py-3 sm:py-3.5 font-serif text-sm font-semibold tracking-[-0.01em] text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
              >
                {t.howItWorks.title}
              </Link>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div className="relative flex-1 pb-6 sm:pb-8 lg:pb-0 w-full">
          <div className="relative mx-auto aspect-3/4 sm:aspect-4/5 w-full max-w-xs sm:max-w-md overflow-hidden lg:max-w-lg">
            <Image
              src="/images/malaysia/Hero1.jpeg"
              alt="Radiant close-up beauty portrait"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
