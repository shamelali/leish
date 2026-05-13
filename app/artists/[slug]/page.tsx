import { notFound } from "next/navigation"
import Link from "next/link"
import { Star, MapPin, Clock, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PortfolioItem } from "@/lib/data"
import { PortfolioGallery } from "@/components/portfolio-gallery"
import { BookingCalendar } from "@/components/booking-calendar"
import { StickyBookBar } from "@/components/sticky-book-bar"
import { ArtistChat } from "@/components/artist-chat"
import { SocialShare } from "@/components/social-share"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function generateStaticParams() {
  // For static generation at build time
  // Return empty array - pages will be generated on-demand
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    return { title: "Artist Not Found" }
  }
  
  const { data: artist } = await supabase
    .from('providers')
    .select('display_name, bio')
    .eq('slug', slug)
    .eq('kind', 'artist')
    .single()
    
  if (!artist) return { title: "Artist Not Found" }
  
  return {
    title: `${artist.display_name} | Leish!`,
    description: artist.bio || `Book ${artist.display_name} for your next event`,
  }
}

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await getSupabaseServerClient()
  
  if (!supabase) {
    notFound()
  }
  
  // Fetch artist from database
  const { data: artist, error } = await supabase
    .from('providers')
    .select(`
      id,
      slug,
      display_name,
      state,
      district,
      hourly_rate,
      specialties,
      rating,
      review_count,
      bio,
      is_verified
    `)
    .eq('slug', slug)
    .eq('kind', 'artist')
    .single()
    
  if (error || !artist) {
    console.error('Error fetching artist:', error)
    notFound()
  }
  
  // Fetch services
  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price_myr, description')
    .eq('provider_id', artist.id)
    .eq('is_active', true)
    .order('price_myr', { ascending: true })
    
  const startingPrice = services && services.length > 0 
    ? Math.min(...services.map((s: { price_myr: number }) => s.price_myr))
    : artist.hourly_rate || 0

  // Transform to match expected format
  const artistData = {
    id: artist.id,
    slug: artist.slug,
    name: artist.display_name,
    location: `${artist.state}, ${artist.district}`,
    rating: artist.rating || 0,
    reviewCount: artist.review_count || 0,
    hourlyRate: artist.hourly_rate || 0,
    image: "/artists/placeholder.jpg", // TODO: Add image field
    bio: artist.bio || "",
    experience: "5+ years", // TODO: Add experience field
    specialties: artist.specialties || [],
    portfolio: [] as PortfolioItem[], // TODO: Add portfolio images
    services: services?.map((s: { name: string; duration_minutes: number; price_myr: number }) => ({
      name: s.name,
      duration: `${s.duration_minutes} mins`,
      price: s.price_myr
    })) || [],
    testimonials: [], // TODO: Add testimonials
    bookedSlots: {}
  }

  return (
    <>
      <section className="bg-background py-8 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/artists"
            className="group mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            All Artists
          </Link>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left Column - Artist Info */}
            <div className="order-2 lg:order-1">
              {/* Artist Header */}
              <div className="mb-6 lg:mb-8">
                <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {artistData.name}
                </h1>
                
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {artistData.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    {artistData.rating.toFixed(1)} ({artistData.reviewCount} reviews)
                  </div>
                  {artist.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {artistData.specialties.map((specialty: string) => (
                    <span
                      key={specialty}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* About */}
              <div className="mb-8">
                <h2 className="font-serif text-xl font-medium text-foreground">About</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {artistData.bio || `${artistData.name} is a professional makeup artist based in ${artistData.location}. Contact for bookings and inquiries.`}
                </p>
              </div>

              {/* Services */}
              <div className="mb-8">
                <h2 className="font-serif text-xl font-medium text-foreground">Services</h2>
                <div className="mt-4 space-y-3">
                  {artistData.services.length > 0 ? (
                    artistData.services.map((service: { name: string; duration: string; price: number }) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between border border-border p-4"
                      >
                        <div>
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {service.duration}
                          </p>
                        </div>
                        <p className="font-serif text-lg font-medium text-accent">
                          MYR {service.price}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No services listed yet.</p>
                  )}
                </div>
              </div>

              {/* Social Share */}
              <div className="mb-8">
                <h2 className="font-serif text-xl font-medium text-foreground mb-4">Share Artist</h2>
                <SocialShare
                  url={`/artists/${artistData.slug}`}
                  title={`Check out ${artistData.name} on Leish!`}
                  description={`${artistData.name} is a professional makeup artist specializing in ${artistData.specialties.join(", ")}. Book now on Leish!`}
                  hashtags={["Leish", "MakeupArtist", "MalaysiaBeauty"]}
                />
              </div>

              {/* Portfolio */}
              {artistData.portfolio.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-serif text-xl font-medium text-foreground">Portfolio</h2>
                  <div className="mt-4">
                    <PortfolioGallery items={artistData.portfolio} />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking */}
            <div className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-24">
                <BookingCalendar artist={artistData} />
              </div>
            </div>
          </div>

          {/* Reviews */}
          {artistData.testimonials.length > 0 && (
            <div className="mt-12 border-t border-border pt-8 lg:mt-16 lg:pt-12">
              <h2 className="font-serif text-xl font-medium text-foreground sm:text-2xl">Customer Reviews</h2>
              <div className="mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {artistData.testimonials.map((review: { name: string; rating: number; text: string }) => (
                  <div key={review.name} className="border border-border p-6">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < review.rating
                              ? "fill-accent text-accent"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">&ldquo;{review.text}&rdquo;</p>
                    <p className="mt-4 text-xs font-medium text-foreground">— {review.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <StickyBookBar
        artistName={artistData.name}
        startingPrice={startingPrice}
      />

      {/* Chat with artist - only for authenticated users */}
      <ArtistChat artistId={artistData.id} artistName={artistData.name} />
    </>
  )
}
