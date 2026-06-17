"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Star, Users, Clock, ArrowRight, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GalleryImage {
  id: string
  room_id: string | null
  image_url: string
  media_type: "image" | "video"
  caption: string | null
  slot: number | null
}

interface StudioRoom {
  id: string
  name: string
  description: string | null
  capacity: string | null
  price_per_hour: number
  sort_order: number
}

interface Studio {
  id: string
  slug: string
  display_name: string
  state: string
  district: string
  bio: string | null
  rating: number
  review_count: number
  studio_rooms: StudioRoom[]
  studio_gallery: GalleryImage[]
}

interface Props {
  studios: Studio[]
}

// Fallback data when DB is empty — matches the 3 room types from static site
const FALLBACK_ROOMS: StudioRoom[] = [
  {
    id: "creative-studio",
    name: "Creative Studio",
    description:
      "Perfect for photoshoots, content creation, and small events. Includes ring lights and backdrops.",
    capacity: "1–5 people",
    price_per_hour: 150,
    sort_order: 0,
  },
  {
    id: "makeup-suite",
    name: "Makeup Station",
    description:
      "Professional makeup station with premium lighting, mirrors, and client seating area.",
    capacity: "1–3 people",
    price_per_hour: 120,
    sort_order: 1,
  },
  {
    id: "classroom",
    name: "Classroom",
    description:
      "Intimate space for makeup classes and workshops. Capacity up to 6 students.",
    capacity: "1–6 people",
    price_per_hour: 100,
    sort_order: 2,
  },
]

export function StudioGalleryGrid({ studios }: Props) {
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)
  const [activeStudio, setActiveStudio] = useState<string | null>(
    studios[0]?.id ?? null
  )

  // Empty state — no studios approved yet
  if (studios.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-2xl text-foreground">
          Studios coming soon
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          We&apos;re onboarding our first studio partners. Check back shortly.
        </p>
        <Link href="/studios" className="mt-6 inline-block">
          <Button variant="outline" size="sm">
            Browse all studios
          </Button>
        </Link>
      </div>
    )
  }

  const studio =
    studios.find((s) => s.id === activeStudio) ?? studios[0]
  const rooms =
    studio.studio_rooms.length > 0
      ? studio.studio_rooms.sort((a, b) => a.sort_order - b.sort_order)
      : FALLBACK_ROOMS
  const gallery = studio.studio_gallery.sort(
    (a, b) => (a.slot ?? 99) - (b.slot ?? 99)
  )

  return (
    <div>
      {/* Studio selector tabs (if multiple studios) */}
      {studios.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-3">
          {studios.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStudio(s.id)}
              className={`border px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors ${
                activeStudio === s.id
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {s.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Studio info strip */}
      <div className="mb-10 flex flex-wrap items-center gap-6 border-b border-border pb-8">
        <div>
          <h2 className="font-serif text-2xl font-medium text-foreground">
            {studio.display_name}
          </h2>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {studio.district}, {studio.state}
            </span>
            {studio.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                {studio.rating} ({studio.review_count} reviews)
              </span>
            )}
          </div>
          {studio.bio && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {studio.bio}
            </p>
          )}
        </div>
        <Link href={`/studios/${studio.slug}/book`} className="ml-auto">
          <Button>
            Book a space <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Media gallery 3×N grid */}
      {gallery.length > 0 && (
        <div className="mb-14">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Gallery
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((item) => (
              <button
                key={item.id}
                onClick={() => setLightbox(item)}
                className="group relative aspect-square overflow-hidden border border-border bg-muted"
              >
                {item.media_type === "video" ? (
                  <div className="flex h-full w-full items-center justify-center bg-ink">
                    <Play className="h-8 w-8 text-paper" />
                  </div>
                ) : (
                  <Image
                    src={item.image_url}
                    alt={item.caption ?? "Studio space"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                )}
                {/* Media type badge */}
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white">
                  {item.media_type === "video" ? (
                    <Play className="h-2.5 w-2.5" />
                  ) : null}
                  {item.media_type}
                </span>
                {item.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-[11px] text-white">{item.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Room cards */}
      <div>
        <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Available Spaces
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            // Find a cover image for this room
            const cover =
              gallery.find(
                (g) => g.room_id === room.id && g.media_type === "image"
              ) ?? null

            return (
              <div
                key={room.id}
                className="group border border-border bg-card transition-all hover:border-accent hover:shadow-sm"
              >
                {/* Room image */}
                <div className="relative aspect-video bg-muted">
                  {cover ? (
                    <Image
                      src={cover.image_url}
                      alt={room.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl opacity-30">🪞</span>
                    </div>
                  )}
                  <div className="absolute right-3 top-3 rounded-sm bg-background/90 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                    Available
                  </div>
                </div>

                {/* Room info */}
                <div className="p-6">
                  <h3 className="font-serif text-xl font-medium text-foreground">
                    {room.name}
                  </h3>
                  {room.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {room.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {room.capacity && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {room.capacity}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Min. 1 hour
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                    <div>
                      <span className="font-serif text-xl text-foreground">
                        MYR {room.price_per_hour}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        / hr
                      </span>
                    </div>
                    <Link href={`/studios/${studio.slug}/book?room=${room.id}`}>
                      <Button size="sm">
                        Book <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-6 top-6 text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.media_type === "video" ? (
              <video
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-sm"
              >
                <source src={lightbox.image_url} type="video/mp4" />
              </video>
            ) : (
              <div className="relative h-[80vh] w-[80vw] max-w-4xl">
                <Image
                  src={lightbox.image_url}
                  alt={lightbox.caption ?? "Studio"}
                  fill
                  className="object-contain"
                  sizes="80vw"
                />
              </div>
            )}
            {lightbox.caption && (
              <p className="mt-3 text-center text-sm text-white/70">
                {lightbox.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
