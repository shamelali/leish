"use client"

import { usePathname, useRouter } from "next/navigation"

export function StickyBookBar({
  artistName,
  startingPrice,
}: {
  artistName: string
  startingPrice: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  const scrollToBooking = () => {
    const el = document.getElementById("booking")
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleBookNow = () => {
    if (pathname?.startsWith("/studios/") && !pathname.endsWith("/book")) {
      router.push(`${pathname}/book`)
      return
    }

    scrollToBooking()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-border bg-background/90 px-6 py-3 backdrop-blur-md lg:hidden">
      <div>
        <p className="font-serif text-sm font-medium text-foreground">
          {artistName}
        </p>
        <p className="text-xs text-muted-foreground">
          From <span className="font-medium text-accent">MYR {startingPrice}</span>
        </p>
      </div>
      <button
        onClick={handleBookNow}
        className="flex min-h-[44px] items-center justify-center bg-foreground px-6 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
      >
        Book Now
      </button>
    </div>
  )
}
