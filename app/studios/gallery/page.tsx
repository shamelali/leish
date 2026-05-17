export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { StudioGalleryGrid } from "@/components/studio-gallery-grid"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Studio Spaces | Leish!",
  description:
    "Discover professional studio spaces for photoshoots, content creation, makeup sessions, and workshops.",
}

export default async function StudioGalleryPage() {
  const supabase = await getSupabaseSsrClient()

  // Fetch all active studios with their rooms and gallery images
  const { data: studios } = supabase
    ? await supabase
        .from("providers")
        .select(`
          id,
          slug,
          display_name,
          state,
          district,
          bio,
          rating,
          review_count,
          studio_rooms (
            id,
            name,
            description,
            capacity,
            price_per_hour,
            sort_order
          ),
          studio_gallery (
            id,
            room_id,
            image_url,
            media_type,
            caption,
            slot
          )
        `)
        .eq("kind", "studio")
        .eq("is_active", true)
        .order("display_name")
    : { data: null }

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
            Studio Spaces
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Browse our spaces
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Professional spaces for photoshoots, content creation, makeup
            sessions, and workshops. Hourly bookings, fully equipped.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse border border-border bg-muted"
                />
              ))}
            </div>
          }
        >
          <StudioGalleryGrid studios={studios ?? []} />
        </Suspense>
      </div>
    </section>
  )
}
