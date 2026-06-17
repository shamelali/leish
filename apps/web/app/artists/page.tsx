export const dynamic = "force-dynamic"

import { Suspense } from "react"
import Link from "next/link"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import type { Metadata } from "next"
import { Star, MapPin, Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Browse Makeup Artists | Leish!",
  description:
    "Discover professional makeup artists in Malaysia. Browse portfolios, compare prices, and book your next appointment.",
}

const ITEMS_PER_PAGE = 12

interface ArtistCard {
  id: string
  slug: string
  display_name: string
  state: string
  district: string
  rating: number | null
  review_count: number | null
  specialties: string[] | null
  profile_image_url: string | null
  starting_price: number | null
}

function ArtistCard({ artist }: { artist: ArtistCard }) {
  const location = [artist.district, artist.state].filter(Boolean).join(", ")
  const image = artist.profile_image_url || "/artists/placeholder.png"

  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group border border-border bg-card transition-colors hover:border-accent"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={artist.display_name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-accent">
          {artist.display_name}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {location}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">
              {artist.rating ? Number(artist.rating).toFixed(1) : "New"}
            </span>
            {artist.review_count != null && artist.review_count > 0 && (
              <span className="text-xs text-muted-foreground">
                ({artist.review_count})
              </span>
            )}
          </div>
          {artist.starting_price != null && artist.starting_price > 0 && (
            <span className="text-sm font-medium text-accent">
              From MYR {artist.starting_price}
            </span>
          )}
        </div>
        {artist.specialties && artist.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {artist.specialties.slice(0, 3).map((s) => (
              <span
                key={s}
                className="border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export default async function ArtistsPage({
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
    .select(
      "id, slug, display_name, state, district, rating, review_count, specialties, profile_image_url, starting_price",
      { count: "exact" }
    )
    .eq("kind", "artist")
    .eq("is_active", true)

  if (query) {
    supabaseQuery = supabaseQuery.or(
      `display_name.ilike.%${query}%,state.ilike.%${query}%,district.ilike.%${query}%,specialties.cs.{${query}}`
    )
  }

  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const { data: artists, count } = await supabaseQuery
    .order("rating", { ascending: false, nullsFirst: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
            Artists
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Browse Makeup Artists
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Discover professional makeup artists across Malaysia. Browse portfolios, compare prices, and book your next appointment.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-10">
          <form className="flex gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by name, location, specialty..."
                className="w-full border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
              />
            </div>
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse border border-border bg-muted"
                />
              ))}
            </div>
          }
        >
          {artists && artists.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-muted-foreground">
                {query
                  ? `No artists found for "${query}".`
                  : "No artists available yet. Check back soon!"}
              </p>
            </div>
          )}
        </Suspense>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <a
                href={`/artists?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                className="border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-foreground transition-colors"
              >
                Previous
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/artists?q=${encodeURIComponent(query)}&page=${p}`}
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
                href={`/artists?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
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
