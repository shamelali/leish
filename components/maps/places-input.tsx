"use client"

import { useRef, useState, useEffect } from "react"
import { loadMapsApi } from "@/lib/maps-loader"

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

type Place = {
  label: string
  placeId: string
  lat: number
  lng: number
}

type PlacesInputProps = {
  value: string
  onChange: (place: Place | null, raw: string) => void
  placeholder?: string
  className?: string
}

export function PlacesInput({
  value,
  onChange,
  placeholder = "Enter your location",
  className = "",
}: PlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loaded, setLoaded] = useState(false)
  const autocompleteRef = useRef<any>(null)
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!key) return
    loadMapsApi(key, "places").then(() => setLoaded(true))
  }, [key])

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return
    if (!window.google?.maps?.places) return

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "my" },
      fields: ["formatted_address", "place_id", "geometry"],
    })

    ac.addListener("place_changed", () => {
      const place = ac.getPlace()
      if (place?.place_id && place?.geometry) {
        onChange(
          {
            label: place.formatted_address,
            placeId: place.place_id,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          place.formatted_address,
        )
      }
    })

    autocompleteRef.current = ac
  }, [loaded, onChange])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(null, e.target.value)}
      placeholder={loaded ? placeholder : "Loading..."}
      className={className}
      disabled={!loaded}
      autoComplete="off"
    />
  )
}
