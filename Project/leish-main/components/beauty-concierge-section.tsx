"use client"

import Link from "next/link"
import { useState } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function BeautyConciergeSection() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Concierge Content - Hidden by default, can be shown via FAB */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="border border-border bg-card p-6 lg:p-8 w-full max-w-2xl mx-4">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-accent">
                  <Sparkles className="h-4 w-4" />
                  Beauty Concierge
                </p>
                <h3 className="mt-3 font-serif text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                  Not sure where to start? Let our concierge guide you.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Share your event type, style preferences, budget, and timing. We&apos;ll help you find the best-fit artist and available slots faster.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  href="/artists"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 border border-foreground px-6 py-3 text-xs font-medium uppercase tracking-widest text-foreground transition-all hover:bg-foreground hover:text-primary-foreground"
                >
                  Start with Concierge
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs font-medium uppercase tracking-[0.3em] text-accent hover:underline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-40 flex h-14 w-14 items-center justify-center bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95",
          "bottom-6 right-6",
          "lg:w-14 lg:h-14"
        )}
        aria-label="Open beauty concierge"
      >
        <Sparkles className="h-6 w-6 lg:h-8 lg:w-8" />
      </button>
    </>
  )
}
