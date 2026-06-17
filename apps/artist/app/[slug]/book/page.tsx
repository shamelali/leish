export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarClock, CheckCircle2, MapPin, ShieldCheck } from "lucide-react"
import { BookingCalendar } from "@/components/booking-calendar"
import { StickyBookBar } from "@/components/sticky-book-bar"
import { getSupabaseServerClient } from "@leish/shared/lib/auth/server"

interface Artist {
  id: string
  slug: string
  name: string
  location: string
  rating: number
  reviewCount: number
  hourlyRate: number
  image: string
  bio: string
  specialties: string[]
  services: { name: string; duration: string; price: number }[]
}

async function getArtistBookingData(slug: string): Promise<Artist | null> {
  const supabase = getSupabaseServerClient()
  const { data: artist, error } = await supabase
    .from("providers")
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
      is_verified,
      avatar_url
    `)
    .eq("slug", slug)
    .eq("kind", "artist")
    .eq("is_active", true)
    .single()

  if (error || !artist) {
    return null
  }

  const { data: services } = await supabase
    .from("services")
    .select("name, duration_minutes, price_myr")
    .eq("provider_id", artist.id)
    .eq("is_active", true)
    .order("price_myr", { ascending: true })

  const hourlyRate = artist.hourly_rate || 0

  return {
    id: artist.id,
    slug: artist.slug,
    name: artist.display_name,
    location: `${artist.state}, ${artist.district}`,
    rating: artist.rating || 0,
    reviewCount: artist.review_count || 0,
    hourlyRate,
    image: artist.avatar_url || "/artists/placeholder.png",
    bio: artist.bio || "",
    specialties: (artist.specialties || []) as string[],
    services: (services || []).map((s: { name: string; duration_minutes: number; price_myr: number }) => ({
      name: s.name,
      duration: `${s.duration_minutes} mins`,
      price: s.price_myr,
    })),
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtistBookingData(slug)

  if (!artist) {
    return {
      title: "Artist Booking | Leish!",
    }
  }

  return {
    title: `Book ${artist.name} | Leish!`,
    description: `Book ${artist.name} in ${artist.location}. Choose your service, pick a 30-minute slot, and pay securely with Billplz.`,
  }
}

export default async function ArtistBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const artist = await getArtistBookingData(slug)

  if (!artist) {
    notFound()
  }

  return (
    <>
      <section className="bg-background py-8 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All Artists
            </Link>
            <span>/</span>
            <Link
              href={`/${artist.slug}`}
              className="transition-colors hover:text-foreground"
            >
              {artist.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">Book</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_1.4fr] lg:gap-12">
            <aside className="space-y-6">
              <div className="border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
                  Artist Booking
                </p>
                <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                  Book {artist.name}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {artist.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    Secure checkout
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {artist.bio || `${artist.name} is available for weddings, events, and production bookings across ${artist.location}.`}
                </p>
              </div>

              <div className="border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
                  Before You Book
                </p>
                <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p>Choose from published 30-minute slots only. Same-day and within-24-hour bookings are blocked.</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p>Billplz is used for checkout, and webhook confirmation is the final source of truth for payment status.</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p>Pick the service that matches your event so pricing and duration stay aligned with the artist menu.</p>
                  </div>
                </div>
              </div>

              <div className="border border-border bg-card p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
                      Starting From
                    </p>
                    <p className="mt-2 font-serif text-3xl text-foreground">
                      MYR {artist.hourlyRate}
                    </p>
                  </div>
                  <Link
                    href={`/${artist.slug}`}
                    className="text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View Profile
                  </Link>
                </div>
                <div className="mt-5 space-y-3">
                  {artist.services.slice(0, 3).map((service) => (
                    <div key={service.name} className="flex items-center justify-between border-t border-border pt-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.duration}</p>
                      </div>
                      <p className="font-serif text-foreground">MYR {service.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div id="booking">
              <BookingCalendar artist={artist} />
            </div>
          </div>
        </div>
      </section>

      <StickyBookBar artistName={artist.name} startingPrice={artist.hourlyRate} />
    </>
  )
}
