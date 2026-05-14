import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, Users, ArrowLeft, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { PortfolioGallery } from "@/components/portfolio-gallery"
import { BookingCalendar } from "@/components/booking-calendar"
import { StickyBookBar } from "@/components/sticky-book-bar"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import type { Category, Studio, PortfolioItem } from "@/lib/data"

// Local types for page data
interface Testimonial {
  name: string
  text: string
  rating: number
}

interface ArtistMember {
  name: string
  role: string
  image: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return { title: "Studio Not Found" }

  const { data: studio } = await supabase
    .from("providers")
    .select("display_name, bio")
    .eq("slug", slug)
    .eq("kind", "studio")
    .single()

  if (!studio) return { title: "Studio Not Found" }

  return {
    title: `${studio.display_name} | Leish!`,
    description: studio.bio || `Book ${studio.display_name} for your next event`,
  }
}

export default async function StudioProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await getSupabaseSsrClient()
  if (!supabase) notFound()

  // Fetch studio from database
  const { data: studio, error } = await supabase
    .from("providers")
    .select(`
      id,
      slug,
      display_name,
      state,
      district,
      starting_price,
      specialties,
      rating,
      review_count,
      team_size,
      bio,
      is_verified,
      profile_image_url
    `)
    .eq("slug", slug)
    .eq("kind", "studio")
    .single()

  if (error || !studio) {
    console.error("Error fetching studio:", error)
    notFound()
  }

  // Fetch services
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price_myr, description")
    .eq("provider_id", studio.id)
    .eq("is_active", true)
    .order("price_myr", { ascending: true })

  // Fetch amenities
  const { data: amenitiesData } = await supabase
    .from("provider_amenities")
    .select(`
      amenity:amenities(name)
    `)
    .eq("provider_id", studio.id)

  const amenities = amenitiesData
    ?.map((a) => {
      const amenity = a.amenity as unknown as { name: string }[]
      return amenity?.[0]?.name ?? ""
    })
    .filter(Boolean) || []

  // Fetch portfolio
  const { data: portfolioData } = await supabase
    .from("portfolio_items")
    .select("id, title, description, image_url, category")
    .eq("provider_id", studio.id)
    .order("sort_order", { ascending: true })

  const portfolioItems: PortfolioItem[] =
    portfolioData?.map((p) => ({
      type: "image" as const,
      src: p.image_url,
      alt: p.title || "",
    })) || []

  // Fetch testimonials
  const { data: testimonialsData } = await supabase
    .from("testimonials")
    .select("customer_name, rating, content")
    .eq("provider_id", studio.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(6)

  const testimonials: Testimonial[] =
    testimonialsData?.map((t) => ({
      name: t.customer_name,
      text: t.content,
      rating: t.rating,
    })) || []

  // Fetch team artists
  const { data: artistsData } = await supabase
    .from("studio_artists")
    .select(
      `
      role,
      artist:providers!artist_id(display_name, profile_image_url)
    `
    )
    .eq("studio_id", studio.id)
    .is("left_at", null)

  const artists: ArtistMember[] =
    artistsData?.map((a) => {
      const artist = a.artist as unknown as { display_name: string; profile_image_url: string | null }[]
      return {
        name: artist?.[0]?.display_name || "",
        role: (a.role as string) || "Artist",
        image: artist?.[0]?.profile_image_url || "/artists/placeholder.jpg",
      }
    }) || []

  const startingPrice =
    services && services.length > 0
      ? Math.min(...services.map((s: { price_myr: number }) => s.price_myr))
      : studio.starting_price || 0

  // Transform to match expected format
  const studioData: Studio = {
    id: studio.id,
    slug: studio.slug,
    name: studio.display_name,
    location: `${studio.state}, ${studio.district}`,
    rating: studio.rating || 0,
    reviewCount: studio.review_count || 0,
    startingPrice: startingPrice,
    teamSize: studio.team_size || 0,
    image: studio.profile_image_url || "/studios/placeholder.jpg",
    bio: studio.bio || "",
    specialties: (studio.specialties || []) as Category[],
    amenities: amenities,
    services:
      services?.map(
        (s: { name: string; duration_minutes: number; price_myr: number }) => ({
          name: s.name,
          duration: `${s.duration_minutes} mins`,
          price: s.price_myr,
        })
      ) || [],
    portfolio: portfolioItems,
    testimonials: testimonials,
    artists: artists,
    bookedSlots: {},
  }

  return (
    <>
      <section className="bg-background py-8 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/studios"
            className="group mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            All Studios
          </Link>

          {/* Studio header */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Photo + info */}
            <div className="lg:col-span-1">
              <div className="relative aspect-16/10 overflow-hidden lg:aspect-4/3">
                <Image
                  src={studioData.image}
                  alt={`${studioData.name}, beauty studio`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
              <div className="mt-6">
                <h1 className="font-serif text-3xl font-medium text-foreground md:text-4xl">
                  {studioData.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{studioData.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="text-sm font-medium text-foreground">
                      {studioData.rating}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({studioData.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{studioData.teamSize} Artists</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {studioData.specialties.map((s) => (
                    <span
                      key={s}
                      className="border border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  {studioData.bio}
                </p>

                {/* Amenities */}
                {studioData.amenities.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
                      Amenities
                    </p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {studioData.amenities.map((amenity) => (
                        <li
                          key={amenity}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="h-3.5 w-3.5 text-accent" />
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Team */}
                {studioData.artists.length > 0 && (
                  <div className="mt-8">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
                      Our Team
                    </p>
                    <div className="mt-3 flex flex-col gap-3">
                      {studioData.artists.map((member) => (
                        <div key={member.name} className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-full">
                            <Image
                              src={member.image}
                              alt={member.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {member.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking calendar */}
            <div className="lg:col-span-2" id="booking">
              <div className="mb-8">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
                  Book Now
                </p>
                <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                  Schedule your session
                </h2>
              </div>
              <BookingCalendar studio={studioData} />
            </div>
          </div>

          {/* Portfolio section */}
          {studioData.portfolio.length > 0 && (
            <div className="mt-20">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
                Portfolio
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                Studio work
              </h2>
              <div className="mt-8">
                <PortfolioGallery items={studioData.portfolio} />
              </div>
            </div>
          )}

          {/* Testimonials */}
          {studioData.testimonials.length > 0 && (
            <div className="mt-20">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
                Reviews
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
                What clients say
              </h2>
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                {studioData.testimonials.map((t, i) => (
                  <div key={i} className="border border-border bg-card p-6">
                    <div className="flex gap-1">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star
                          key={j}
                          className="h-3.5 w-3.5 fill-accent text-accent"
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground italic">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <p className="mt-4 font-serif text-sm font-medium text-foreground">
                      {t.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services table */}
          <div className="mt-20 pb-20 lg:pb-0">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
              Services & Pricing
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground">
              Full service menu
            </h2>
            <div className="mt-8 border border-border">
              {studioData.services.map((service, i) => (
                <div
                  key={service.name}
                  className={cn(
                    "flex items-center justify-between p-5",
                    i < studioData.services.length - 1 && "border-b border-border"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {service.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {service.duration}
                    </p>
                  </div>
                  <p className="font-serif text-lg text-foreground">
                    MYR {service.price}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky mobile book bar */}
      <StickyBookBar artistName={studioData.name} startingPrice={startingPrice} />
    </>
  )
}