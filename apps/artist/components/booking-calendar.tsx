"use client"

import { useState } from "react"
import { CalendarDays, Clock, CheckCircle2 } from "lucide-react"

interface ArtistCalendarProps {
  artist: {
    id: string
    name: string
    hourlyRate: number
    services: { name: string; duration?: string; duration_minutes?: number; price?: number; price_myr?: number }[]
  }
}

export function BookingCalendar({ artist }: ArtistCalendarProps) {
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  const mappedServices =
    artist.services?.map((s) => ({
      name: s.name,
      duration: s.duration || `${s.duration_minutes} mins`,
      price: s.price || s.price_myr || 0,
    })) ?? []

  return (
    <div className="border border-border bg-card p-6">
      <h3 className="font-serif text-xl font-semibold text-foreground">
        Book {artist.name}
      </h3>

      {mappedServices.length > 0 && (
        <div className="mt-6">
          <label className="text-xs font-medium uppercase tracking-widest text-accent">
            1. Select a service
          </label>
          <div className="mt-3 space-y-2">
            {mappedServices.map((service) => (
              <button
                key={service.name}
                onClick={() => setSelectedService(service.name)}
                className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                  selectedService === service.name
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.duration}</p>
                </div>
                <p className="font-serif text-sm text-foreground">MYR {service.price}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <label className="text-xs font-medium uppercase tracking-widest text-accent">
          {mappedServices.length > 0 ? "2" : "1"}. Pick a date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={minDate}
          className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
        />
      </div>

      {selectedDate && (
        <div className="mt-6">
          <label className="text-xs font-medium uppercase tracking-widest text-accent">
            {mappedServices.length > 0 ? "3" : "2"}. Choose a time slot
          </label>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a date to view available 30-minute slots.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>30-minute slots</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Minimum 24 hours advance booking</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Secure checkout via Billplz</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Starting from MYR {artist.hourlyRate} &middot; Sign in to complete booking
      </p>
    </div>
  )
}
