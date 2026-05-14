import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarClock, CheckCircle2, MapPin, ShieldCheck, Users } from "lucide-react"
import { BookingCalendar } from "@/components/booking-calendar"
import { StickyBookBar } from "@/components/sticky-book-bar"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import type { Category, Studio } from "@/lib/data"

async function getStudioBookingData(slug: string): Promise<Studio | null> {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return null

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
      is_verified
    `)
    .eq("slug", slug)
    .eq("kind", "studio")
    .eq("is_active", true)
    .single()

  if (error || !studio) {
    return null
  }

  const { data: services } = await supabase
    .from("services")
    .select("name, duration_minutes, price_myr")
    .eq("provider_id", studio.id)
    .eq("is_active", true)
    .order("price_myr", { ascending: true })

  const mappedServices =
    services?.map((service: { name: string; duration_minutes: number; price_myr: number }) => ({
      name: service.name,
      duration: `${service.duration_minutes} mins`,
      price: service.price_myr,
    })) ?? []

  const startingPrice =
    mappedServices.length > 0
      ? Math.min(...mappedServices.map((service) => service.price))
      : studio.starting_price || 0

  return {
    id: studio.id,
    slug: studio.slug,
    name: studio.display_name,
    location: `${studio.state}, ${studio.district}`,
    rating: studio.rating || 0,
    reviewCount: studio.review_count || 0,
    startingPrice,
    teamSize: studio.team_size || 0,
    image: "/studios/placeholder.jpg",
    bio: studio.bio || "",
    specialties: (studio.specialties || []) as Category[],
    amenities: ["Private Rooms", "Free Parking", "WiFi"],
    services: mappedServices,
    portfolio: [],
    testimonials: [],
    artists: [],
    bookedSlots: {},
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const studio = await getStudioBookingData(slug)

  if (!studio) {
    return {
      title: "Studio Booking | Leish!",
    }
  }

  return {
    title: `Book ${studio.name} | Leish!`,
    description: `Book ${studio.name} in ${studio.location}. Choose your service, pick a 30-minute slot, and pay securely with Billplz.`,
  }
}

export default async function StudioBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const studio = await getStudioBookingData(slug)

  if (!studio) {
    notFound()
  }

  return (
    <>
      <section className="bg-background py-8 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <Link
              href="/studios"
              className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All Studios
            </Link>
            <span>/</span>
            <Link
              href={`/studios/${studio.slug}`}
              className="transition-colors hover:text-foreground"
            >
              {studio.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">Book</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_1.4fr] lg:gap-12">
            <aside className="space-y-6">
              <div className="border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
                  Studio Booking
                </p>
                <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                  Book {studio.name}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {studio.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {studio.teamSize || 1} artists
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    Secure checkout
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {studio.bio || `${studio.name} is ready for weddings, events, and production bookings across ${studio.location}.`}
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
                    <p>Pick the service that matches your event so pricing and duration stay aligned with the studio menu.</p>
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
                      MYR {studio.startingPrice}
                    </p>
                  </div>
                  <Link
                    href={`/studios/${studio.slug}`}
                    className="text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View Profile
                  </Link>
                </div>
                <div className="mt-5 space-y-3">
                  {studio.services.slice(0, 3).map((service) => (
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
              <BookingCalendar studio={studio} />
            </div>
          </div>
        </div>
      </section>

      <StickyBookBar artistName={studio.name} startingPrice={studio.startingPrice} />
    </>
  )
}
