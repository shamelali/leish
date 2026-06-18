"use client"

import { useState, useEffect } from "react"

interface Service {
  id: string
  provider_id: string
  name: string
  duration_minutes: number
  price_myr: number
  is_active: boolean
}

export function ProServiceManager({ providerId }: { providerId: string }) {
  const [services, setServices] = useState<Service[]>([])
  const [name, setName] = useState("")
  const [duration, setDuration] = useState(60)
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = async () => {
    if (!providerId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/services?provider_id=${providerId}`)
      if (res.ok) {
        setServices(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => fetchServices())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId])

  const handleCreate = async () => {
    setError(null)
    try {
      const res = await fetch(`/api/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          name,
          durationMinutes: duration,
          priceMyr: price,
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setName("")
        setDuration(60)
        setPrice(0)
        fetchServices()
      } else {
        setError(data.error || "Failed to create service")
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create service")
    }
  }

  const handleUpdate = async (svc: Service) => {
    setError(null)
    try {
      const res = await fetch(`/api/services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: svc.id,
          providerId,
          updates: {
            name: svc.name,
            duration_minutes: svc.duration_minutes,
            price_myr: svc.price_myr,
            is_active: svc.is_active,
          },
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        fetchServices()
      } else {
        setError(data.error || "Failed to update")
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update service")
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/services`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, providerId }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        fetchServices()
      } else {
        setError(data.error || "Failed to delete")
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete service")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">New service</h4>
        <div>
          <label className="block text-xs text-muted-foreground">Name</label>
          <input
            className="mt-1 w-full border border-border px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Duration (min)</label>
          <input
            type="number"
            className="mt-1 w-full border border-border px-2 py-1"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">Price (MYR)</label>
          <input
            type="number"
            className="mt-1 w-full border border-border px-2 py-1"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value, 10))}
          />
        </div>
        <button
          onClick={handleCreate}
          className="mt-2 rounded bg-accent px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-foreground"
        >
          Add service
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div>
        <h4 className="text-sm font-medium text-foreground">Existing services</h4>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {services.map((svc) => (
              <li key={svc.id} className="border border-border p-2">
                <div className="flex items-center justify-between">
                  <input
                    className="w-1/3 border border-border px-1 py-1"
                    value={svc.name}
                    onChange={(e) => {
                      setServices(services.map(s => s.id === svc.id ? { ...s, name: e.target.value } : s))
                    }}
                  />
                  <input
                    type="number"
                    className="w-1/6 border border-border px-1 py-1"
                    value={svc.duration_minutes}
                    onChange={(e) => {
                      setServices(services.map(s => s.id === svc.id ? { ...s, duration_minutes: parseInt(e.target.value, 10) } : s))
                    }}
                  />
                  <input
                    type="number"
                    className="w-1/6 border border-border px-1 py-1"
                    value={svc.price_myr}
                    onChange={(e) => {
                      setServices(services.map(s => s.id === svc.id ? { ...s, price_myr: parseInt(e.target.value, 10) } : s))
                    }}
                  />
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={svc.is_active}
                      onChange={(e) => {
                        setServices(services.map(s => s.id === svc.id ? { ...s, is_active: e.target.checked } : s))
                      }}
                    />
                    <span className="text-xs text-muted-foreground">active</span>
                  </label>
                  <button
                    onClick={() => handleUpdate(svc)}
                    className="text-xs text-accent hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleDelete(svc.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
