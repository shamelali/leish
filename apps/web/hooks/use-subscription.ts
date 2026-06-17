"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type SubscriptionTier = "free" | "pro"

export interface SubscriptionStatus {
  tier: SubscriptionTier
  tierStartedAt: string | null
  tierExpiresAt: string | null
  isLoading: boolean
  error: string | null
}

export function useSubscription(providerId: string | null) {
  const [status, setStatus] = useState<SubscriptionStatus>({
    tier: "free",
    tierStartedAt: null,
    tierExpiresAt: null,
    isLoading: true,
    error: null,
  })
  const supabase = getSupabaseBrowserClient()

  const fetchStatus = async () => {
    if (!providerId || !supabase) {
      setStatus((prev) => ({ ...prev, isLoading: false }))
      return
    }

    try {
      const { data, error } = await supabase
        .from("providers")
        .select("tier, tier_started_at, tier_expires_at")
        .eq("id", providerId)
        .single()

      if (error) throw error

      setStatus({
        tier: data?.tier || "free",
        tierStartedAt: data?.tier_started_at || null,
        tierExpiresAt: data?.tier_expires_at || null,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      setStatus({
        tier: "free",
        tierStartedAt: null,
        tierExpiresAt: null,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to fetch subscription status",
      })
    }
  }

  useEffect(() => {
    queueMicrotask(() => fetchStatus())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, supabase])

  const upgradeToPro = async () => {
    if (!providerId) return { error: "No provider ID" }

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, tier: "pro" }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create checkout")

      if (data.url) {
        window.location.href = data.url
      }

      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to upgrade" }
    }
  }

  const cancelSubscription = async () => {
    if (!providerId) return { error: "No provider ID" }

    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to cancel")

      await fetchStatus()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to cancel" }
    }
  }

  return {
    ...status,
    upgradeToPro,
    cancelSubscription,
    refetch: fetchStatus,
  }
}

export function useSubscriptionFeatures(tier: SubscriptionTier) {
  const features = {
    free: {
      commission: 10,
      maxClients: 10,
      maxServices: 5,
      maxPhotos: 20,
      hasAnalytics: false,
      hasPrioritySupport: false,
      hasFeaturedPlacement: false,
      hasCustomUrl: false,
    },
    pro: {
      commission: 5,
      maxClients: Infinity,
      maxServices: Infinity,
      maxPhotos: 50,
      hasAnalytics: true,
      hasPrioritySupport: true,
      hasFeaturedPlacement: true,
      hasCustomUrl: true,
    },
  }

  return features[tier] || features.free
}

// export function useIsFeatureAvailable - broken, not used
