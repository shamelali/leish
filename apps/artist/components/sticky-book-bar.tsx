import Link from "next/link"

export function StickyBookBar({ artistName, startingPrice }: { artistName: string; startingPrice: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 backdrop-blur-md z-40">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">{artistName}</p>
          <p className="text-xs text-muted-foreground">From MYR {startingPrice}</p>
        </div>
        <Link href="/sign-in" className="rounded bg-foreground px-6 py-2 text-sm font-medium text-primary-foreground">Sign in to book</Link>
      </div>
    </div>
  )
}
