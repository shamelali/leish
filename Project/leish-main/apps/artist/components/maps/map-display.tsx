export function MapDisplay({ address, title, className }: { address: string; title: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center border border-border bg-muted ${className}`}>
      <p className="text-xs text-muted-foreground">Map: {title} — {address}</p>
    </div>
  )
}
