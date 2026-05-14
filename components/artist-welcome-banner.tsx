"use client"

import { useState, useTransition, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { X } from "lucide-react"

export function ArtistWelcomeBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState(false)

  // Derive state directly from URL params - no side effects
  const showBanner = useMemo(() => {
    return searchParams.get("onboarded") === "1" && !dismissed
  }, [searchParams, dismissed])

  // Handler to clean URL param when banner is shown
  const handleCleanUrl = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete("onboarded")
    startTransition(() => {
      router.replace(url.pathname, { scroll: false })
    })
  }

  if (!showBanner) return null

  return (
    <div className="mb-6 border border-accent/30 bg-accent/5 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">🎉</span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Your profile is live!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clients can now find and book you on Leish. Add your availability slots so bookings
              can come in, and consider uploading portfolio images from the Profile tab.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissed(true)
            handleCleanUrl()
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
