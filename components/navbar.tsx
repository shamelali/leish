"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
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
    void supabase.auth.getUser().then(({ data }) => {
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
  }

   return (
     <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
       <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/leish-logo.svg" 
              alt="Leish! Logo" 
              width={100}
              height={30}
              className="h-6 w-auto"
            />
          </Link>
         {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium tracking-wide uppercase transition-colors hover:text-accent",
                "font-serif tracking-[-0.01em] normal-case",
                pathname === link.href
                  ? "text-accent"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <ThemeToggle />
           {isAuthenticated ? (
             <button
               type="button"
               onClick={handleSignOut}
               className="hidden rounded-full border border-border/60 px-4 py-2 font-serif text-sm font-semibold tracking-[-0.01em] text-muted-foreground transition-colors hover:text-foreground md:inline-block"
             >
               {t.nav.signOut}
             </button>
           ) : (
             <>
               <Link
                 href="/register"
                 className="hidden rounded-full border border-border/60 px-4 py-2 font-serif text-sm font-semibold tracking-[-0.01em] text-muted-foreground transition-colors hover:text-foreground md:inline-block mr-2"
               >
                 {t.auth.registerTitle}
               </Link>
               <Link
                 href="/sign-in"
                 className="hidden rounded-full border border-border/60 px-4 py-2 font-serif text-sm font-semibold tracking-[-0.01em] text-muted-foreground transition-colors hover:text-foreground md:inline-block"
               >
                 {t.nav.signIn}
               </Link>
             </>
           )}

          {/* Mobile Sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="text-foreground md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-70 bg-background p-0">
              <SheetHeader className="border-b border-border px-6 py-5">
               <SheetTitle className="flex items-center gap-2">
                <Image 
                  src="/leish-logo.svg" 
                  alt="Leish! Logo" 
                  width={100}
                  height={30}
                  className="h-7 w-auto"
                />
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
                        "flex min-h-12 items-center font-serif text-base font-semibold tracking-[-0.01em] transition-colors",
                        pathname === link.href
                          ? "text-accent"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-6 border-t border-border pt-6">
                  <div className="mb-3 flex items-center justify-center gap-3">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                   {isAuthenticated ? (
                     <button
                       type="button"
                       onClick={handleSignOut}
                       className="flex min-h-12 w-full items-center justify-center rounded-full border border-border px-4 font-serif text-sm font-semibold tracking-[-0.01em] text-foreground transition-colors hover:border-foreground"
                     >
                       {t.nav.signOut}
                     </button>
                   ) : (
                     <>
                       <Link
                         href="/register"
                         onClick={() => setSheetOpen(false)}
                         className="flex min-h-12 w-full items-center justify-center rounded-full border border-border px-4 font-serif text-sm font-semibold tracking-[-0.01em] text-foreground transition-colors hover:border-foreground mb-2"
                       >
                         {t.auth.registerTitle}
                       </Link>
                       <Link
                         href="/sign-in"
                         onClick={() => setSheetOpen(false)}
                         className="flex min-h-12 items-center justify-center rounded-full border border-border px-4 font-serif text-sm font-semibold tracking-[-0.01em] text-foreground transition-colors hover:border-foreground"
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
