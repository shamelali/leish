export function BookingCalendar({ artist }: { artist: any }) {
  return (
    <div className="border border-border bg-card p-6">
      <h2 className="font-serif text-xl font-medium text-foreground">Book {artist.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        From MYR {artist.hourlyRate}/hr
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Booking calendar is available when you sign in.
      </p>
    </div>
  )
}
