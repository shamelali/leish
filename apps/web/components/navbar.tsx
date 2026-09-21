"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { Logo } from "@/components/logo"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useTranslation } from "@/lib/i18n/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

function useNavLinks() {
  const { t } = useTranslation()
  return [
    { href: "/", label: t.nav.home },
    { href: "/artists", label: t.nav.browseArtists },
    { href: "/studios", label: t.nav.browseStudios },
  ]
}

export function Navbar() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()
  const navLinks = useNavLinks()

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setIsAuthenticated(!!data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    await supabase.auth.signOut()
    setSheetOpen(false)
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <nav className="section-shell flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-9 w-auto" />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium tracking-[0.12em] uppercase transition-colors",
                pathname === link.href ? "text-accent" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {isAuthenticated && <NotificationBell />}

          {isAuthenticated ? (
            <>
              <Link
                href="/account"
                className="hidden rounded-full border border-foreground/15 bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent md:inline-flex"
              >
                {t.nav.account}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden rounded-full bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-[#2e2320] md:inline-flex"
              >
                {t.nav.signOut}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="hidden rounded-full border border-foreground/15 bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent md:inline-flex"
              >
                {t.auth.signUpTitle}
              </Link>
              <Link
                href="/sign-in"
                className="hidden rounded-full bg-foreground px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-[#2e2320] md:inline-flex"
              >
                {t.nav.signIn}
              </Link>
            </>
          )}

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 bg-background text-foreground md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm bg-background p-0">
              <SheetHeader className="border-b border-border px-6 py-5">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <Logo className="h-8 w-auto" />
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col px-6 py-6">
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        "flex min-h-12 items-center rounded-xl px-3 text-base font-medium transition-colors",
                        pathname === link.href ? "bg-[#f4e7d6] text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-6 flex items-center justify-center gap-3 border-t border-border pt-6">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>

                <div className="mt-6 space-y-3">
                  {isAuthenticated ? (
                    <>
                      <div className="flex justify-center">
                        <NotificationBell />
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setSheetOpen(false)}
                        className="flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
                      >
                        {t.nav.account}
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex min-h-12 w-full items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-primary-foreground transition hover:bg-[#2e2320]"
                      >
                        {t.nav.signOut}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/sign-up"
                        onClick={() => setSheetOpen(false)}
                        className="flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
                      >
                        {t.auth.signUpTitle}
                      </Link>
                      <Link
                        href="/sign-in"
                        onClick={() => setSheetOpen(false)}
                        className="flex min-h-12 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-primary-foreground transition hover:bg-[#2e2320]"
                      >
                        {t.nav.signIn}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
