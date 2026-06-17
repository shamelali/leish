"use client"

import { useState } from "react"

interface ProviderData {
  id: string
  display_name: string
  state: string
  district: string
  is_active: boolean
}

export function ProProfileForm({ initial }: { initial: ProviderData | null }) {
  const [displayName, setDisplayName] = useState(initial?.display_name || "")
  const [stateVal, setStateVal] = useState(initial?.state || "")
  const [district, setDistrict] = useState(initial?.district || "")
  const [isActive, setIsActive] = useState(initial?.is_active || false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    if (!initial) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const updates = {
        display_name: displayName,
        state: stateVal,
        district,
        is_active: isActive,
      }
      const res = await fetch(`/api/providers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initial.id, updates }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Save failed")
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (!initial) {
    return <p className="text-sm text-muted-foreground">No provider found.</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="provider-display-name" className="block text-xs text-muted-foreground">
            Display name
          </label>
          <input
            id="provider-display-name"
            name="display_name"
            className="mt-2 w-full border border-border bg-background px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="provider-state" className="block text-xs text-muted-foreground">
            State
          </label>
          <input
            id="provider-state"
            name="state"
            className="mt-2 w-full border border-border bg-background px-3 py-2"
            value={stateVal}
            onChange={(e) => setStateVal(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="provider-district" className="block text-xs text-muted-foreground">
            District
          </label>
          <input
            id="provider-district"
            name="district"
            className="mt-2 w-full border border-border bg-background px-3 py-2"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="provider-active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-border text-accent focus:ring-0"
        />
        <label htmlFor="provider-active" className="text-xs text-muted-foreground">
          Active for bookings
        </label>
      </div>
      <button
        disabled={saving}
        onClick={handleSave}
        className="border border-foreground bg-foreground px-4 py-2 text-sm text-primary-foreground hover:bg-accent"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-success">Saved!</p>}
    </div>
  )
}
