"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PortfolioItem } from "@/lib/data"

type GalleryFilter = "all" | "beforeAfter" | "video"

function BeforeAfterSlider({ before, after, alt }: { before: string; after: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const dragging = useRef(false)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(pct)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }, [updatePosition])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    updatePosition(e.clientX)
  }, [updatePosition])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative aspect-[3/4] w-full cursor-ew-resize select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="slider"
      aria-label={`Before and after comparison: ${alt}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
    >
      {/* After image (full) */}
      <Image src={after} alt={`After: ${alt}`} fill className="object-cover" sizes="(max-width: 768px) 90vw, 512px" />
      {/* Before image (clipped) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image src={before} alt={`Before: ${alt}`} fill className="object-cover" sizes="(max-width: 768px) 90vw, 512px" />
      </div>
      {/* Divider line */}
      <div className="absolute top-0 bottom-0 z-10 w-0.5 bg-card" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-card bg-foreground/70 backdrop-blur-sm">
          <ChevronLeft className="h-3 w-3 text-primary-foreground" />
          <ChevronRight className="h-3 w-3 text-primary-foreground" />
        </div>
      </div>
      {/* Labels */}
      <span className="absolute left-3 bottom-3 z-10 bg-foreground/70 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-primary-foreground backdrop-blur-sm">
        Before
      </span>
      <span className="absolute right-3 bottom-3 z-10 bg-foreground/70 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-primary-foreground backdrop-blur-sm">
        After
      </span>
    </div>
  )
}

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [filter, setFilter] = useState<GalleryFilter>("all")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true
    if (filter === "beforeAfter") return item.type === "beforeAfter"
    if (filter === "video") return item.type === "video"
    return true
  })

  const hasBeforeAfter = items.some((i) => i.type === "beforeAfter")
  const hasVideo = items.some((i) => i.type === "video")

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goNext = () => {
    if (lightboxIndex !== null) setLightboxIndex((lightboxIndex + 1) % filteredItems.length)
  }
  const goPrev = () => {
    if (lightboxIndex !== null) setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length)
  }

  const filters: { key: GalleryFilter; label: string; show: boolean }[] = [
    { key: "all", label: "All", show: true },
    { key: "beforeAfter", label: "Before & After", show: hasBeforeAfter },
    { key: "video", label: "Videos", show: hasVideo },
  ]

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {filters.filter((f) => f.show).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "border px-4 py-2 text-xs font-medium uppercase tracking-widest transition-all",
              filter === f.key
                ? "border-foreground bg-foreground text-primary-foreground"
                : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {filteredItems.map((item, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="group relative aspect-square overflow-hidden"
            aria-label={`View ${item.alt}`}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />

            {/* Type overlay badge */}
            {item.type === "beforeAfter" && (
              <span className="absolute left-2 top-2 bg-foreground/70 px-2 py-1 text-[9px] font-medium uppercase tracking-widest text-primary-foreground backdrop-blur-sm">
                Before & After
              </span>
            )}
            {item.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center border border-primary-foreground/50 bg-foreground/50 backdrop-blur-sm transition-transform group-hover:scale-110">
                  <Play className="h-5 w-5 fill-primary-foreground text-primary-foreground" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Portfolio lightbox"
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-primary-foreground/80 hover:text-primary-foreground"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={goPrev}
            className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center text-primary-foreground/80 hover:text-primary-foreground"
            aria-label="Previous"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div className="relative w-full max-w-lg">
            {filteredItems[lightboxIndex].type === "beforeAfter" && filteredItems[lightboxIndex].before ? (
              <BeforeAfterSlider
                before={filteredItems[lightboxIndex].before!}
                after={filteredItems[lightboxIndex].src}
                alt={filteredItems[lightboxIndex].alt}
              />
            ) : filteredItems[lightboxIndex].type === "video" && filteredItems[lightboxIndex].videoUrl ? (
              <div className="relative aspect-video w-full overflow-hidden bg-foreground">
                <iframe
                  src={filteredItems[lightboxIndex].videoUrl}
                  title={filteredItems[lightboxIndex].alt}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image
                  src={filteredItems[lightboxIndex].src}
                  alt={filteredItems[lightboxIndex].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 512px"
                />
              </div>
            )}
          </div>

          <button
            onClick={goNext}
            className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center text-primary-foreground/80 hover:text-primary-foreground"
            aria-label="Next"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          <div className="absolute bottom-4 text-xs text-primary-foreground/60">
            {lightboxIndex + 1} / {filteredItems.length}
          </div>
        </div>
      )}
    </>
  )
}
