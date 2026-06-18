export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-center">
        <p className="font-serif text-lg font-semibold text-foreground">Leish Studio</p>
        <p className="mt-2 text-xs text-muted-foreground">
          <span suppressHydrationWarning>&copy; {new Date().getFullYear()} Leish!</span> All rights reserved.
        </p>
      </div>
    </footer>
  )
}
