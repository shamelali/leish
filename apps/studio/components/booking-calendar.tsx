"use client"

import { useState } from "react"

interface StudioCalendarProps {
  studio: {
    id: string
    name: string
    location: string
    startingPrice: number
    specialties: string[]
    services: { name: string; duration: string; price: number }[]
    bookedSlots: Record<string, boolean>
  }
}

export function BookingCalendar({ studio }: StudioCalendarProps) {
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [, setSelectedSlot] = useState<string>("")

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setSelectedSlot("")
  }

  return (
    <div className="border border-border bg-card p-6">
      <h3 className="font-serif text-xl font-semibold text-foreground">
        Book {studio.name}
      </h3>

      {/* Service selection */}
      <div className="mt-6">
        <label className="text-xs font-medium uppercase tracking-widest text-accent">
          1. Select a service
        </label>
        <div className="mt-3 space-y-2">
          {studio.services.map((service) => (
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

      {/* Date selection */}
      <div className="mt-6">
        <label className="text-xs font-medium uppercase tracking-widest text-accent">
          2. Pick a date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          min={minDate}
          className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
        />
      </div>

      {selectedDate && (
        <div className="mt-6">
          <label className="text-xs font-medium uppercase tracking-widest text-accent">
            3. Choose a time slot
          </label>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a date to view available 30-minute slots.
          </p>
        </div>
      )}

      <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
        Starting from MYR {studio.startingPrice} &middot; 30-min slots &middot; Secure checkout
      </p>
    </div>
  )
}
