"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, DoorOpen, Image as ImageIcon, CalendarClock, CreditCard, Star, User, Clock, Menu } from "lucide-react"
import { cn } from "@leish/shared/lib/utils"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/rooms", label: "Rooms", icon: DoorOpen },
    { href: "/photos", label: "Photos", icon: ImageIcon },
    { href: "/bookings", label: "Bookings", icon: CalendarClock },
    { href: "/payments", label: "Payments", icon: CreditCard },
    { href: "/reviews", label: "Reviews", icon: Star },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/availability", label: "Availability", icon: Clock },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Leish Studio
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-accent",
                  pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                    ? "text-accent"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <button className="text-foreground md:hidden" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 bg-background p-0">
            <SheetHeader className="border-b border-border px-6 py-5">
              <SheetTitle className="font-serif text-lg font-semibold text-foreground">
                Leish Studio
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4 py-6">
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex min-h-12 items-center gap-3 font-serif text-base font-semibold tracking-[-0.01em] transition-colors",
                      pathname === link.href
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
