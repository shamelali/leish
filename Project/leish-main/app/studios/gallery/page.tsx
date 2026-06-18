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

const ITEMS_PER_PAGE = 6

export default async function StudioGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page } = await searchParams
  const query = q || ""
  const currentPage = Math.max(1, parseInt(page || "1"))

  const supabase = await getSupabaseSsrClient()

  let supabaseQuery = supabase
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
    `, { count: "exact" })
    .eq("kind", "studio")
    .eq("is_active", true)

  if (query) {
    supabaseQuery = supabaseQuery.or(
      `display_name.ilike.%${query}%,state.ilike.%${query}%,district.ilike.%${query}%,bio.ilike.%${query}%`
    )
  }

  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const { data: studios, count } = await supabaseQuery
    .order("display_name")
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

        {/* Search bar */}
        <div className="mb-10">
          <form className="flex gap-3 max-w-md">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by name, location..."
              className="flex-1 border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="border border-foreground bg-foreground px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-accent hover:border-accent transition-colors"
            >
              Search
            </button>
          </form>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <a
                href={`/studios/gallery?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                className="border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-foreground transition-colors"
              >
                Previous
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/studios/gallery?q=${encodeURIComponent(query)}&page=${p}`}
                className={`border px-4 py-2 text-sm transition-colors ${
                  p === currentPage
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
                }`}
              >
                {p}
              </a>
            ))}
            {currentPage < totalPages && (
              <a
                href={`/studios/gallery?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                className="border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-foreground transition-colors"
              >
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
