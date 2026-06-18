"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export interface ProviderAlert {
  id: string
  alert_type: "low_rating" | "external_review" | "complaint" | "manual_review"
  severity: "low" | "medium" | "high"
  description: string
  source_url?: string
  status: "open" | "investigating" | "resolved"
  created_at: string
  resolved_at?: string
  resolution_notes?: string
}

export function useProviderAlerts(providerId: string | null) {
  const [alerts, setAlerts] = useState<ProviderAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  const fetchAlerts = async () => {
    if (!providerId || !supabase) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("provider_alerts")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAlerts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch alerts")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => fetchAlerts())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, supabase])

  const createAlert = async (alert: Omit<ProviderAlert, "id" | "created_at">) => {
    if (!providerId) return { error: "No provider ID" }
    if (!supabase) return { error: "Database unavailable" }

    try {
      const { data, error } = await supabase
        .from("provider_alerts")
        .insert({
          ...alert,
          provider_id: providerId,
        })
        .select()
        .single()

      if (error) throw error
      await fetchAlerts()
      return { data, error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to create alert" }
    }
  }

  const updateAlert = async (alertId: string, updates: Partial<ProviderAlert>) => {
    if (!supabase) return { error: "Database unavailable" }
    try {
      const { error } = await supabase
        .from("provider_alerts")
        .update(updates)
        .eq("id", alertId)

      if (error) throw error
      await fetchAlerts()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to update alert" }
    }
  }

  const resolveAlert = async (alertId: string, resolutionNotes: string) => {
    return updateAlert(alertId, {
      status: "resolved",
      resolution_notes: resolutionNotes,
    })
  }

  return {
    alerts,
    isLoading,
    error,
    openAlerts: alerts.filter((a) => a.status === "open"),
    highSeverityAlerts: alerts.filter((a) => a.status === "open" && a.severity === "high"),
    refetch: fetchAlerts,
    createAlert,
    updateAlert,
    resolveAlert,
  }
}

// Hook for auto-creating alerts based on conditions
export function useAutoAlerts(providerId: string | null) {
  const supabase = getSupabaseBrowserClient()

  const checkAndCreateLowRatingAlert = async (rating: number, reviewCount: number) => {
    if (!providerId || !supabase || reviewCount < 5) return

    if (rating < 3.0) {
      // Check if alert already exists
      const { data: existing } = await supabase
        .from("provider_alerts")
        .select("id")
        .eq("provider_id", providerId)
        .eq("alert_type", "low_rating")
        .eq("status", "open")
        .maybeSingle()

      if (!existing) {
        await supabase.from("provider_alerts").insert({
          provider_id: providerId,
          alert_type: "low_rating",
          severity: "high",
          description: `Average rating dropped to ${rating.toFixed(1)}/5.0 based on ${reviewCount} reviews.`,
          status: "open",
        })
      }
    }
  }

  return {
    checkAndCreateLowRatingAlert,
  }
}