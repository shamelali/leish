export const dynamic = "force-dynamic"

import { Suspense } from "react"
import Link from "next/link"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import type { Metadata } from "next"
import { Star, MapPin, Search, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Browse Studios | Leish!",
  description:
    "Discover professional beauty studios in Malaysia. Browse services, compare prices, and book your next session.",
}

const ITEMS_PER_PAGE = 12

interface StudioCard {
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
  team_size: number | null
}

function StudioCard({ studio }: { studio: StudioCard }) {
  const location = [studio.district, studio.state].filter(Boolean).join(", ")
  const image = studio.profile_image_url || "/studios/placeholder.png"

  return (
    <Link
      href={`/studios/${studio.slug}`}
      className="group border border-border bg-card transition-colors hover:border-accent"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={studio.display_name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-accent">
          {studio.display_name}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {location}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">
              {studio.rating ? Number(studio.rating).toFixed(1) : "New"}
            </span>
            {studio.review_count != null && studio.review_count > 0 && (
              <span className="text-xs text-muted-foreground">
                ({studio.review_count})
              </span>
            )}
          </div>
          {studio.team_size != null && studio.team_size > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {studio.team_size} artists
            </div>
          )}
        </div>
        {studio.starting_price != null && studio.starting_price > 0 && (
          <div className="mt-2">
            <span className="text-sm font-medium text-accent">
              From MYR {studio.starting_price}
            </span>
          </div>
        )}
        {studio.specialties && studio.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {studio.specialties.slice(0, 3).map((s) => (
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

export default async function StudiosPage({
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
      "id, slug, display_name, state, district, rating, review_count, specialties, profile_image_url, starting_price, team_size",
      { count: "exact" }
    )
    .eq("kind", "studio")
    .eq("is_active", true)

  if (query) {
    supabaseQuery = supabaseQuery.or(
      `display_name.ilike.%${query}%,state.ilike.%${query}%,district.ilike.%${query}%,specialties.cs.{${query}}`
    )
  }

  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const { data: studios, count } = await supabaseQuery
    .order("rating", { ascending: false, nullsFirst: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
            Studios
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Browse Studios
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Discover professional beauty studios across Malaysia. Browse services, compare prices, and book your next session.
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
          {studios && studios.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {studios.map((studio) => (
                <StudioCard key={studio.id} studio={studio} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-muted-foreground">
                {query
                  ? `No studios found for "${query}".`
                  : "No studios available yet. Check back soon!"}
              </p>
            </div>
          )}
        </Suspense>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <a
                href={`/studios?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                className="border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-foreground transition-colors"
              >
                Previous
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/studios?q=${encodeURIComponent(query)}&page=${p}`}
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
                href={`/studios?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
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
