"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CalendarRange, CreditCard, Star, Clock, User, Receipt, Menu } from "lucide-react"
import { cn } from "@leish/shared/lib/utils"
import { useState } from "react"

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarRange },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/availability", label: "Availability", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/charges", label: "Charges", icon: Receipt },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
        <Link href="/" className="font-serif text-xl font-semibold text-foreground">
          Leish Artist
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors rounded",
                  isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t border-border md:hidden">
          <nav className="flex flex-col px-6 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors",
                    isActive ? "text-accent bg-accent/5" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
