export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Leish! Artist Portal. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
