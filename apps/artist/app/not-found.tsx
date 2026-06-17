import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-4xl font-medium text-foreground">404</h1>
      <p className="mt-2 text-sm text-muted-foreground">Page not found</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
