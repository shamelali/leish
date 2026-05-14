"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/language-context";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
             <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/leish-logo.svg"
                  alt="Leish! Logo"
                  width={100}
                  height={30}
                  className="h-7 w-auto"
                />
             </Link>
            <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-muted-foreground">
              {t.footer.tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              {t.footer.explore}
            </h3>
            <ul className="mt-3 sm:mt-4 flex flex-col gap-2 sm:gap-3">
              <li>
                <Link
                  href="/artists"
                  className="text-sm text-muted-foreground transition-colors hover:text-accent"
                >
                  {t.footer.browseArtists}
                </Link>
              </li>
              <li>
                <Link
                  href="/artists"
                  className="text-sm text-muted-foreground transition-colors hover:text-accent"
                >
                  {t.footer.bridalMakeup}
                </Link>
              </li>
              <li>
                <Link
                  href="/artists"
                  className="text-sm text-muted-foreground transition-colors hover:text-accent"
                >
                  {t.footer.photoshootMakeup}
                </Link>
              </li>
              <li>
                <Link
                  href="/artists"
                  className="text-sm text-muted-foreground transition-colors hover:text-accent"
                >
                  {t.footer.sfxLooks}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              {t.footer.company}
            </h3>
            <ul className="mt-3 sm:mt-4 flex flex-col gap-2 sm:gap-3">
              <li>
                <span className="text-sm text-muted-foreground cursor-default">
                  {t.footer.aboutUs}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground cursor-default">
                  {t.footer.careers}
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground cursor-default">
                  {t.footer.press}
                </span>
              </li>
              <li>
                <a
                  href="mailto:hello@leish.my"
                  className="text-sm text-muted-foreground transition-colors hover:text-accent"
                >
                  {t.footer.contact}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
              {t.footer.stayInTouch}
            </h3>
            <p className="mt-3 sm:mt-4 text-sm text-muted-foreground">
              {t.footer.newsletterText}
            </p>
            <div className="mt-3 sm:mt-4 flex">
              <input
                id="newsletter-email"
                name="newsletter_email"
                type="email"
                placeholder={t.footer.newsletterPlaceholder}
                className="flex-1 border border-border bg-background px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                aria-label="Email for newsletter"
              />
              <button className="border border-foreground bg-foreground px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-foreground">
                {t.footer.join}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 border-t border-border pt-6 sm:pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Leish!. {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
