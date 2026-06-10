let mapsLoaded = false
let mapsLoadPromise: Promise<void> | null = null

export function loadMapsApi(key: string, libraries = "places") {
  if (mapsLoaded) return Promise.resolve()
  if (mapsLoadPromise) return mapsLoadPromise

  mapsLoadPromise = new Promise<void>((resolve, reject) => {
    window.initGoogleMaps = () => {
      mapsLoaded = true
      resolve()
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=${libraries}&callback=initGoogleMaps`
    script.async = true
    script.onerror = reject
    document.head.appendChild(script)
  })

  return mapsLoadPromise
}
