import { Suspense } from "react"
import { ArtistGrid } from "@/components/artist-grid"
import { getArtists } from "@/lib/actions/artists"
import { getFavorites } from "@/lib/actions/favorites"

export const metadata = {
  title: "Browse Artists | Leish!",
  description:
    "Discover elite freelance makeup artists for weddings, events, and editorial shoots. Filter by specialty and find your perfect match.",
}

export default async function ArtistsPage() {
  const [artists, favorites] = await Promise.all([
    getArtists(),
    getFavorites(),
  ])

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8 sm:mb-12">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-accent">
            Our Artists
          </p>
          <h1 className="mt-2 sm:mt-3 font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Browse artists
          </h1>
          <p className="mt-3 sm:mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Every artist on Leish! has been vetted for exceptional skill,
            professionalism, and artistry. Find the perfect artist for your next
            occasion.
          </p>
        </div>

        <Suspense fallback={<div className="text-muted-foreground">Loading artists...</div>}>
          <ArtistGrid artists={artists} favorites={favorites} />
        </Suspense>
      </div>
    </section>
  )
}
