"use client"

export function StudioOnboardingBanner({ studioName }: { studioName: string }) {
  return (
    <div className="mb-6 border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg">⏳</span>
        <div>
          <p className="text-sm font-medium text-foreground">
            {studioName} is pending review
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The Leish team will review your studio listing within 24–48 hours. You&apos;ll receive
            an email at your registered address once it&apos;s live. In the meantime, you can
            update your profile, services, and availability.
          </p>
        </div>
      </div>
    </div>
  )
}
