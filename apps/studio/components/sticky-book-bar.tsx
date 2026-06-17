import Link from "next/link"

export function StickyBookBar({
  artistName,
  startingPrice,
}: {
  artistName: string
  startingPrice: number
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">{artistName}</p>
          <p className="text-xs text-muted-foreground">
            From MYR {startingPrice}
          </p>
        </div>
        <Link
          href="#booking"
          className="rounded-lg border border-foreground bg-foreground px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-accent hover:border-accent"
        >
          Book Now
        </Link>
      </div>
    </div>
  )
}
