"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"
import { useTranslation } from "@/lib/i18n/language-context"

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border/80 bg-[#201814] text-white">
      <div className="section-shell py-12 sm:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <Logo className="h-9 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#d9b66d] sm:text-xs">
              {t.footer.explore}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li>
                <Link href="/artists" className="transition hover:text-[#f4e7d6]">
                  {t.footer.browseArtists}
                </Link>
              </li>
              <li>
                <Link href="/artists" className="transition hover:text-[#f4e7d6]">
                  {t.footer.bridalMakeup}
                </Link>
              </li>
              <li>
                <Link href="/artists" className="transition hover:text-[#f4e7d6]">
                  {t.footer.photoshootMakeup}
                </Link>
              </li>
              <li>
                <Link href="/artists" className="transition hover:text-[#f4e7d6]">
                  {t.footer.sfxLooks}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#d9b66d] sm:text-xs">
              {t.footer.company}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li>
                <span className="cursor-default">{t.footer.aboutUs}</span>
              </li>
              <li>
                <span className="cursor-default">{t.footer.careers}</span>
              </li>
              <li>
                <span className="cursor-default">{t.footer.press}</span>
              </li>
              <li>
                <a href="mailto:hello@leish.my" className="transition hover:text-[#f4e7d6]">
                  {t.footer.contact}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#d9b66d] sm:text-xs">
              {t.footer.stayInTouch}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {t.footer.newsletterText}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                id="newsletter-email"
                name="newsletter_email"
                type="email"
                placeholder={t.footer.newsletterPlaceholder}
                className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#d9b66d] focus:outline-none"
                aria-label="Email for newsletter"
              />
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f4e7d6] px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[#201814] transition hover:bg-white">
                {t.footer.join}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/60">
          <span suppressHydrationWarning>&copy; {new Date().getFullYear()} Leish!</span>. {t.footer.copyright}
        </div>
      </div>
    </footer>
  )
}
