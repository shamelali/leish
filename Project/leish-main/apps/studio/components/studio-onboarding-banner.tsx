import Link from "next/link"

export function StudioOnboardingBanner({ studioName }: { studioName: string }) {
  return (
    <div className="border border-accent/30 bg-accent/5 p-4 text-sm">
      <p className="font-medium text-foreground">
        {studioName} is pending review
      </p>
      <p className="mt-1 text-muted-foreground">
        Your studio profile is being reviewed by the Leish team. You&apos;ll be
        notified once it&apos;s approved and visible to clients.
      </p>
      <Link
        href="/onboarding"
        className="mt-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent transition-colors hover:text-foreground"
      >
        Complete your profile
      </Link>
    </div>
  )
}
