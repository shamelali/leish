import { HeroSection } from "@/components/hero-section"
import { CategoriesSection } from "@/components/categories-section"
import { FeaturedArtists } from "@/components/featured-artists"
import { HowItWorks } from "@/components/how-it-works"
import { TestimonialsSection } from "@/components/testimonials-section"
import Link from "next/link"
import { ArrowRight, CalendarDays, ShieldCheck, Sparkles } from "lucide-react"

function TrustHighlights() {
  const highlights = [
    {
      icon: ShieldCheck,
      title: "Verified talent",
      text: "Every artist is reviewed for craft, professionalism, and client experience.",
    },
    {
      icon: CalendarDays,
      title: "Effortless booking",
      text: "Choose availability, compare packages, and book in a flow designed for clarity.",
    },
    {
      icon: Sparkles,
      title: "Luxury outcomes",
      text: "From bridal beauty to editorials, each booking is tailored for a standout result.",
    },
  ]

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent sm:text-xs">
            Why Leish
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-[-0.05em] text-foreground sm:text-4xl">
            Studio-level polish, marketplace convenience.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-[0_18px_32px_rgba(32,24,20,0.05)] sm:p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4e7d6] text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-serif text-2xl font-medium tracking-[-0.04em] text-foreground">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BookingCTASection() {
  return (
    <section className="bg-[#f9f3ee] py-16 sm:py-20 lg:py-24">
      <div className="section-shell">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-[#201814] px-6 py-8 shadow-[0_30px_80px_rgba(32,24,20,0.18)] sm:px-8 lg:px-10 lg:py-12">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(201,161,110,0.18),_transparent_58%)] lg:block" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#d9b66d] sm:text-xs">
                Book with confidence
              </p>
              <h2 className="mt-3 max-w-lg font-serif text-3xl font-medium tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
                Your signature beauty moment, beautifully booked.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                Discover trusted artists, curated experiences, and a booking flow designed to feel as polished as the look itself.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/artists"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7efe8] px-6 py-3 text-sm font-medium text-[#201814] transition hover:-translate-y-0.5"
                >
                  Browse artists
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/studios"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-[#d9b66d] hover:text-[#d9b66d]"
                >
                  Explore studios
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Wedding glam",
                "Editorial beauty",
                "Event styling",
                "Studio bookings",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/80 backdrop-blur-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedArtists />
      <HowItWorks />
      <TestimonialsSection />
      <TrustHighlights />
      <BookingCTASection />
    </>
  )
}
