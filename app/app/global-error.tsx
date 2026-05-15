"use client"

export default function GlobalError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-medium text-foreground">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => reset()}
              className="mt-6 rounded-xl border border-accent bg-secondary px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
