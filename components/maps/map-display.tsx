"use client"

import { useRef, useEffect, useState } from "react"
import { loadMapsApi } from "@/lib/maps-loader"
import { cn } from "@/lib/utils"

interface MapDisplayProps {
  address: string
  title?: string
  className?: string
}

export function MapDisplay({ address, title, className }: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!key) {
      setError("Google Maps API key not configured")
      return
    }
    loadMapsApi(key, "places").then(() => setLoaded(true))
  }, [key])

  useEffect(() => {
    if (!loaded || !mapRef.current || !address) return

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address }, (results: any, status: string) => {
      if (status !== "OK" || !results?.[0]) {
        setError("Could not locate this address on the map")
        return
      }

      const location = results[0].geometry.location
      const lat = typeof location.lat === "function" ? location.lat() : location.lat
      const lng = typeof location.lng === "function" ? location.lng() : location.lng

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      new window.google.maps.Marker({
        map,
        position: { lat, lng },
        title: title || address,
      })
    })
  }, [loaded, address, title])

  if (error) {
    return (
      <div className={cn("flex items-center justify-center rounded-sm border border-border bg-secondary text-sm text-muted-foreground", className)}>
        {error}
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className={cn("rounded-sm border border-border", className)}
    />
  )
}
