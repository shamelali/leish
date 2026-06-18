"use client"

import { useState, useEffect } from "react"

interface Slot {
  id: string
  provider_id: string
  starts_at: string
  ends_at: string
  is_booked: boolean
}

export function ProAvailabilityManager({ providerId }: { providerId: string }) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toDatetimeLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const fetchSlots = async () => {
    if (!providerId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/availability?providerId=${providerId}`)
      if (res.ok) {
        setSlots(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => fetchSlots())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId])

  const handleCreate = async () => {
    setError(null)
    try {
      const res = await fetch(`/api/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, startsAt, endsAt }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setStartsAt("")
        setEndsAt("")
        fetchSlots()
      } else {
        setError(data.error || "Failed to create slot")
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create slot")
    }
  }

  const handleStartsAtChange = (value: string) => {
    setStartsAt(value)
    const start = new Date(value)
    if (Number.isNaN(start.getTime())) return
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    setEndsAt(toDatetimeLocal(end))
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="start-time" className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Start time
        </label>
        <input
          id="start-time"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => handleStartsAtChange(e.target.value)}
          step={1800}
          placeholder="Select start time"
          className="mt-1 w-full border border-border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="end-time" className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
          End time
        </label>
        <input
          id="end-time"
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          step={1800}
          placeholder="Select end time"
          className="mt-1 w-full border border-border px-3 py-2"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Slots are 30-minute intervals. Customer bookings open only for times at least 24 hours ahead.
      </p>
      <button
        onClick={handleCreate}
        disabled={!startsAt || !endsAt}
        className="w-full rounded bg-accent px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-foreground"
      >
        Add Slot
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="mt-6">
        <h4 className="text-sm font-medium text-foreground">Existing Slots</h4>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {slots.map((s) => (
              <li key={s.id} className="text-xs">
                {new Date(s.starts_at).toLocaleString()} - {new Date(s.ends_at).toLocaleString()} {s.is_booked ? "(booked)" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
