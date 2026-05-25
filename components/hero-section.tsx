"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n/language-context"

const HERO_IMAGES = [
  {
    src: "/images/malaysia/hero/Hero2.jpeg",
    alt: "Malaysian bridal-inspired soft glam makeup",
  },
  {
    src: "/images/malaysia/hero/portfolio-1.jpg",
    alt: "Malaysia makeup portfolio look with warm tones",
  },
  {
    src: "/images/malaysia/hero/artist-5.jpg",
    alt: "Contemporary Malaysian beauty makeup style",
  },
]

export function HeroSection() {
  const { t, lang } = useTranslation()
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % HERO_IMAGES.length)
    }, 4000)

    return () => window.clearInterval(interval)
  }, [])

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
            {HERO_IMAGES.map((image, index) => (
              <Image
                key={image.src}
                src={image.src}
                alt={image.alt}
                fill
                className={`object-cover transition-opacity duration-700 ${
                  activeImageIndex === index ? "opacity-100" : "opacity-0"
                }`}
                priority={index === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, 50vw"
              />
            ))}
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-sm">
              {HERO_IMAGES.map((image, index) => (
                <button
                  key={`${image.src}-dot`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`Show slide ${index + 1}`}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    activeImageIndex === index ? "bg-white" : "bg-white/45 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
