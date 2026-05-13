import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h2 className="font-serif text-2xl font-medium text-foreground">
          Page Not Found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl border border-accent bg-secondary px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
