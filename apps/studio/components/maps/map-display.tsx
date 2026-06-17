export function MapDisplay({
  address,
  className,
}: {
  address: string
  className?: string
}) {
  const encodedAddress = encodeURIComponent(address)
  const mapsUrl = `https://www.google.com/maps?q=${encodedAddress}`

  return (
    <div className={className}>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full w-full items-center justify-center rounded border border-border bg-muted px-4 text-center transition-colors hover:bg-accent/10"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            View on Google Maps
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{address}</p>
        </div>
      </a>
    </div>
  )
}
