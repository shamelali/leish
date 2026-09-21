"use client"

import { CalendarDays, Search, Sparkles } from "lucide-react"
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
      description:
        lang === "ms"
          ? "Bersantai dan biarkan artis anda melakukan keajaiban. Tiba di acara anda kelihatan dan berasa benar-benar cemerlang."
          : "Sit back and let your artist work their magic. Arrive at your event looking and feeling absolutely radiant.",
    },
  ]

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent sm:text-xs">
            The Process
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-[-0.04em] text-foreground sm:text-4xl">
            {t.howItWorks.title}
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-[0_18px_30px_rgba(32,24,20,0.04)] sm:p-7">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4e7d6] text-accent">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="font-serif text-lg tracking-[-0.04em] text-accent">{step.number}</span>
              </div>
              <h3 className="mt-6 font-serif text-2xl font-medium tracking-[-0.04em] text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
