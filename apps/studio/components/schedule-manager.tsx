"use client"

import { useCallback, useEffect, useState } from "react"
import {
  mapSettings,
  type StudioSettings,
  type StudioSettingsRow,
} from "@/lib/services/studio-engine"

/**
 * ScheduleManager — the studio dashboard screen for the booking engine.
 *
 * Manages:
 *   - recurring weekly availability windows (per resource or whole studio)
 *   - one-off blocked periods
 *   - bookable resources (rooms / artists / venue)
 *   - per-studio engine settings
 *
 * Data flows through /api/studio/schedule (owner-authorized). Business rules
 * are enforced in the database engine — this UI only edits configuration.
 */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const RESOURCE_KINDS = ["venue", "room", "artist", "staff", "chair", "equipment", "other"]

const TIMEZONES = [
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Manila",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/London",
  "Etc/UTC",
]

interface Resource {
  id: string
  provider_id: string
  kind: string
  ref_id: string | null
  name: string
  capacity: number
  is_active: boolean
}

interface Window {
  id: string
  provider_id: string
  resource_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface Blocked {
  id: string
  provider_id: string
  resource_id: string | null
  starts_at: string
  ends_at: string
  reason: string | null
  is_active: boolean
}

interface Snapshot {
  providerId: string
  engineActive: boolean
  legacyBookedCount: number
  settings: Record<string, unknown> | null
  resources: Resource[]
  windows: Window[]
  blocked: Blocked[]
}

function timeLabel(t: string) {
  return t.slice(0, 5)
}

function fmtLocal(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}

function LegacyModeBanner({ legacyBookedCount }: { legacyBookedCount: number }) {
  let withSlots = ""
  if (legacyBookedCount > 0) {
    const plural = legacyBookedCount === 1 ? "" : "s"
    withSlots = ` with ${legacyBookedCount} future booked slot${plural}`
  }
  return (
    <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Legacy 30-minute slot mode.</span> Your studio is
      still using manually created 30-minute slots{withSlots}. Add your weekly schedule below to
      switch to the flexible engine — existing bookings are unaffected.
    </p>
  )
}

export function ScheduleManager({ providerId }: { providerId: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // window form
  const [winDay, setWinDay] = useState(1)
  const [winStart, setWinStart] = useState("09:00")
  const [winEnd, setWinEnd] = useState("17:00")
  const [winResource, setWinResource] = useState("")

  // blocked form
  const [blockStart, setBlockStart] = useState("")
  const [blockEnd, setBlockEnd] = useState("")
  const [blockReason, setBlockReason] = useState("")
  const [blockResource, setBlockResource] = useState("")

  // resource form
  const [newResourceKind, setNewResourceKind] = useState("room")
  const [newResourceName, setNewResourceName] = useState("")

  // settings form
  const [settings, setSettings] = useState<StudioSettings | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/studio/schedule?providerId=${providerId}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to load schedule")
      }
      const data = (await res.json()) as Snapshot
      setSnapshot(data)
      setSettings(mapSettings(data.settings as StudioSettingsRow | null | undefined))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load schedule")
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    // Deferred so the initial synchronous state changes inside load() do not
    // cascade renders from the effect body (react-hooks/set-state-in-effect).
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const post = useCallback(
    async (body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/studio/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, providerId }),
        })
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
        if (!res.ok || data.ok === false) {
          return { ok: false, error: data.error || "Request failed" }
        }
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Request failed" }
      }
    },
    [providerId],
  )

  const run = useCallback(
    async (body: Record<string, unknown>) => {
      const result = await post(body)
      if (!result.ok) {
        setError(result.error || "Request failed")
        return false
      }
      setError(null)
      await load()
      return true
    },
    [post, load],
  )

  const addWindow = async () => {
    const ok = await run({
      action: "addWindow",
      dayOfWeek: winDay,
      startTime: winStart,
      endTime: winEnd,
      resourceId: winResource || null,
    })
    if (ok) {
      setWinStart("09:00")
      setWinEnd("17:00")
    }
  }

  const addBlocked = async () => {
    if (!blockStart || !blockEnd) return
    const ok = await run({
      action: "addBlocked",
      startsAt: new Date(blockStart).toISOString(),
      endsAt: new Date(blockEnd).toISOString(),
      reason: blockReason || null,
      resourceId: blockResource || null,
    })
    if (ok) {
      setBlockStart("")
      setBlockEnd("")
      setBlockReason("")
    }
  }

  const addResource = async () => {
    const name = newResourceName.trim()
    if (!name) return
    const ok = await run({
      action: "addResource",
      kind: newResourceKind,
      name,
      capacity: 1,
    })
    if (ok) setNewResourceName("")
  }

  const saveSettings = async () => {
    if (!settings) return
    await run({
      action: "updateSettings",
      timezone: settings.timezone,
      slotInterval: settings.slotInterval,
      defaultBufferMin: settings.defaultBufferMin,
      bookingHorizonDays: settings.bookingHorizonDays,
      minAdvanceMinutes: settings.minAdvanceMinutes,
      autoConfirm: settings.autoConfirm,
      depositMode: settings.depositMode,
      depositAmount: settings.depositAmount,
      cancellationPolicyHours: settings.cancellationPolicyHours,
      allowCustomerCancel: settings.allowCustomerCancel,
      maxBookingsPerSlot: settings.maxBookingsPerSlot,
      resourceSelection: settings.resourceSelection,
    })
  }

  if (loading && !snapshot) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-muted" />
        ))}
      </div>
    )
  }

  if (!snapshot) {
    return <p className="text-sm text-muted-foreground">{error || "Nothing to show yet."}</p>
  }

  const resourceName = (id: string | null) =>
    id ? snapshot.resources.find((r) => r.id === id)?.name || "Unknown" : "All resources"

  const windowsByDay = DAYS.map((name, idx) => ({
    name,
    items: snapshot.windows.filter((w) => w.day_of_week === idx),
  }))

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Mode banner */}
      {snapshot.engineActive ? (
        <p className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-foreground">
          <span className="font-medium text-accent">Engine schedule active.</span>{" "}
          Customers book any duration against your weekly windows. Availability is computed live.
        </p>
      ) : (
        <LegacyModeBanner legacyBookedCount={snapshot.legacyBookedCount} />
      )}

      {/* Weekly schedule */}
      <section className="border border-border bg-card p-5">
        <h3 className="font-serif text-lg font-semibold text-foreground">Weekly schedule</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Recurring opening hours. “All resources” applies to the whole studio; pick a specific
          room/artist to give it its own hours.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-xs text-muted-foreground">
            Resource
            <select
              value={winResource}
              onChange={(e) => setWinResource(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              <option value="">All resources (whole studio)</option>
              {snapshot.resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.kind})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Day
            <select value={winDay} onChange={(e) => setWinDay(Number(e.target.value))} className={`${inputCls} mt-1`}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Opens
            <input type="time" value={winStart} onChange={(e) => setWinStart(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <label className="block text-xs text-muted-foreground">
            Closes
            <input type="time" value={winEnd} onChange={(e) => setWinEnd(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <div className="flex items-end">
            <button
              onClick={() => void addWindow()}
              className="w-full rounded-md border border-accent bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Add hours
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {windowsByDay.map((day) =>
            day.items.length === 0 ? null : (
              <div key={day.name} className="flex flex-wrap items-baseline gap-2 border-t border-border pt-3">
                <span className="w-24 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {day.name}
                </span>
                {day.items.map((w) => (
                  <span
                    key={w.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                  >
                    {timeLabel(w.start_time)}–{timeLabel(w.end_time)}
                    <span className="text-muted-foreground">{resourceName(w.resource_id)}</span>
                    <button
                      onClick={() => void run({ action: "deleteWindow", id: w.id })}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Remove ${day.name} ${timeLabel(w.start_time)} window`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ),
          )}
          {snapshot.windows.length === 0 && (
            <p className="text-xs text-muted-foreground">No weekly hours yet.</p>
          )}
        </div>
      </section>

      {/* Blocked periods */}
      <section className="border border-border bg-card p-5">
        <h3 className="font-serif text-lg font-semibold text-foreground">Closed / blocked times</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          One-off closures — holidays, leave, maintenance, or blocking a single room.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-xs text-muted-foreground">
            Resource
            <select
              value={blockResource}
              onChange={(e) => setBlockResource(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              <option value="">All resources (whole studio)</option>
              {snapshot.resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            From
            <input type="datetime-local" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <label className="block text-xs text-muted-foreground">
            To
            <input type="datetime-local" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <label className="block text-xs text-muted-foreground">
            Reason (optional)
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Deepavali"
              className={`${inputCls} mt-1`}
            />
          </label>
          <div className="flex items-end">
            <button
              onClick={() => void addBlocked()}
              disabled={!blockStart || !blockEnd}
              className="w-full rounded-md border border-destructive/50 bg-background px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              Block time
            </button>
          </div>
        </div>

        {snapshot.blocked.length > 0 && (
          <ul className="mt-4 space-y-2">
            {snapshot.blocked.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-foreground">
                    {fmtLocal(b.starts_at)} → {fmtLocal(b.ends_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {resourceName(b.resource_id)}
                    {b.reason ? ` · ${b.reason}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => void run({ action: "deleteBlocked", id: b.id })}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Remove blocked period"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Resources */}
      <section className="border border-border bg-card p-5">
        <h3 className="font-serif text-lg font-semibold text-foreground">Bookable resources</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Rooms, artists, chairs — anything a customer can book. “venue” is the whole-studio unit.
        </p>

        {snapshot.resources.length > 0 && (
          <ul className="mt-4 space-y-2">
            {snapshot.resources.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {r.kind}
                  </span>
                  <span className="truncate text-foreground">{r.name}</span>
                  {!r.is_active && <span className="text-xs text-muted-foreground">(hidden)</span>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.kind !== "venue" && (
                    <button
                      onClick={() => void run({ action: "deleteResource", id: r.id })}
                      className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => void run({ action: "setResourceActive", id: r.id, isActive: !r.is_active })}
                    className="text-xs font-medium text-accent transition-colors hover:text-accent/80"
                  >
                    {r.is_active ? "Hide" : "Show"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-xs text-muted-foreground">
            Kind
            <select
              value={newResourceKind}
              onChange={(e) => setNewResourceKind(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              {RESOURCE_KINDS.filter((k) => k !== "venue").map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="block flex-1 text-xs text-muted-foreground">
            Name
            <input
              type="text"
              value={newResourceName}
              onChange={(e) => setNewResourceName(e.target.value)}
              placeholder="e.g. Bridal Suite B / Artist #2 / Chair 4"
              className={`${inputCls} mt-1`}
            />
          </label>
          <button
            onClick={() => void addResource()}
            disabled={!newResourceName.trim()}
            className="rounded-md border border-accent bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            Add resource
          </button>
        </div>
      </section>

      {/* Settings */}
      <section className="border border-border bg-card p-5">
        <h3 className="font-serif text-lg font-semibold text-foreground">Booking rules</h3>
        {!settings ? (
          <p className="mt-2 text-sm text-muted-foreground">Settings are not available.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-xs text-muted-foreground">
                Timezone
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className={`${inputCls} mt-1`}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-muted-foreground">
                Booking style
                <select
                  value={settings.resourceSelection}
                  onChange={(e) =>
                    setSettings({ ...settings, resourceSelection: e.target.value as StudioSettings["resourceSelection"] })
                  }
                  className={`${inputCls} mt-1`}
                >
                  <option value="studio">Whole studio (single unit)</option>
                  <option value="room">Customers pick a room / resource</option>
                  <option value="artist">Customers pick an artist</option>
                </select>
              </label>
              <label className="block text-xs text-muted-foreground">
                Slot interval (minutes)
                <input
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={settings.slotInterval}
                  onChange={(e) => setSettings({ ...settings, slotInterval: Number(e.target.value) })}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Gap between appointments (min)
                <input
                  type="number"
                  min={0}
                  max={480}
                  value={settings.defaultBufferMin}
                  onChange={(e) => setSettings({ ...settings, defaultBufferMin: Number(e.target.value) })}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Advance notice (minutes)
                <input
                  type="number"
                  min={0}
                  value={settings.minAdvanceMinutes}
                  onChange={(e) => setSettings({ ...settings, minAdvanceMinutes: Number(e.target.value) })}
                  className={`${inputCls} mt-1`}
                />
                <span className="text-[10px]">1440 = 24 hours</span>
              </label>
              <label className="block text-xs text-muted-foreground">
                Bookable horizon (days)
                <input
                  type="number"
                  min={1}
                  max={730}
                  value={settings.bookingHorizonDays}
                  onChange={(e) => setSettings({ ...settings, bookingHorizonDays: Number(e.target.value) })}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Deposit
                <select
                  value={settings.depositMode}
                  onChange={(e) =>
                    setSettings({ ...settings, depositMode: e.target.value as StudioSettings["depositMode"] })
                  }
                  className={`${inputCls} mt-1`}
                >
                  <option value="none">No deposit</option>
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed amount (MYR)</option>
                </select>
              </label>
              {settings.depositMode !== "none" && (
                <label className="block text-xs text-muted-foreground">
                  {settings.depositMode === "percent" ? "Percent (%)" : "Amount (MYR)"}
                  <input
                    type="number"
                    min={0}
                    value={settings.depositAmount}
                    onChange={(e) => setSettings({ ...settings, depositAmount: Number(e.target.value) })}
                    className={`${inputCls} mt-1`}
                  />
                </label>
              )}
              <label className="block text-xs text-muted-foreground">
                Free-cancel window (hours)
                <input
                  type="number"
                  min={0}
                  value={settings.cancellationPolicyHours}
                  onChange={(e) => setSettings({ ...settings, cancellationPolicyHours: Number(e.target.value) })}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="flex items-center gap-2 pt-5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={settings.autoConfirm}
                  onChange={(e) => setSettings({ ...settings, autoConfirm: e.target.checked })}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Auto-confirm bookings
              </label>
              <label className="flex items-center gap-2 pt-5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={settings.allowCustomerCancel}
                  onChange={(e) => setSettings({ ...settings, allowCustomerCancel: e.target.checked })}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Customers may cancel online
              </label>
            </div>
            <button
              onClick={() => void saveSettings()}
              className="mt-5 rounded-md border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Save booking rules
            </button>
          </>
        )}
      </section>
    </div>
  )
}
