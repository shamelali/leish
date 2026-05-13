"use client"

import { Search, CalendarDays, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n/language-context"

export function HowItWorks() {
  const { t, lang } = useTranslation()

  const steps = [
    {
      icon: Search,
      number: "01",
      title: t.howItWorks.step1.title,
      description: t.howItWorks.step1.description,
    },
    {
      icon: CalendarDays,
      number: "02",
      title: t.howItWorks.step2.title,
      description: t.howItWorks.step2.description,
    },
    {
      icon: Sparkles,
      number: "03",
      title: "Glow",
      description: lang === "ms" 
        ? "Bersantai dan biarkan artis anda melakukan keajaiban. Tiba di acara anda kelihatan dan berasa benar-benar cemerlang."
        : "Sit back and let your artist work their magic. Arrive at your event looking and feeling absolutely radiant.",
    },
  ]

  return (
    <section className="bg-background py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-accent">
            The Process
          </p>
          <h2 className="mt-2 sm:mt-3 font-serif text-2xl sm:text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {t.howItWorks.title}
          </h2>
        </div>

        <div className="mt-10 sm:mt-16 grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center border border-accent">
                <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <p className="mt-4 sm:mt-6 font-serif text-sm text-accent">{step.number}</p>
              <h3 className="mt-2 font-serif text-lg sm:text-xl font-medium text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 sm:mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
