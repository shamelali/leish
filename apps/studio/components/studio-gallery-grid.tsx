import Image from "next/image"
import Link from "next/link"
import { Star, MapPin } from "lucide-react"

interface StudioGalleryItem {
  id: string
  slug: string
  display_name: string
  state: string
  district: string
  bio: string
  rating: number
  review_count: number
  studio_rooms?: Array<{
    id: string
    name: string
    description: string
    capacity: string
    price_per_hour: number
    sort_order: number
  }>
  studio_gallery?: Array<{
    id: string
    room_id: string
    image_url: string
    media_type: string
    caption: string
    slot: string
  }>
}

export function StudioGalleryGrid({
  studios,
}: {
  studios: StudioGalleryItem[]
}) {
  if (!studios.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">No studios found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {studios.map((studio) => {
        const galleryImage = studio.studio_gallery?.[0]?.image_url
        const lowestPrice = studio.studio_rooms
          ? Math.min(...studio.studio_rooms.map((r) => r.price_per_hour))
          : 0

        return (
          <Link
            key={studio.id}
            href={`/${studio.slug}`}
            className="group block border border-border bg-card transition-colors hover:border-accent"
          >
            <div className="relative aspect-4/3 overflow-hidden">
              {galleryImage ? (
                <Image
                  src={galleryImage}
                  alt={studio.display_name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <p className="text-xs text-muted-foreground">No image</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-accent">
                {studio.display_name}
              </h3>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {studio.state}{studio.district ? `, ${studio.district}` : ""}
                </span>
                {studio.rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    {Number(studio.rating).toFixed(1)}
                  </span>
                )}
              </div>
              {lowestPrice > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  From MYR {lowestPrice}/hr
                </p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
