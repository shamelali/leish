import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Catherine M.",
    role: "Bride",
    text: "Leish! connected me with the most incredible artist for my wedding. The whole experience, from browsing to booking, was seamless and luxurious.",
    rating: 5,
  },
  {
    name: "Alexandra R.",
    role: "Fashion Editor",
    text: "As someone who works in fashion, I have high standards. Leish! consistently delivers artists who understand editorial beauty at the highest level.",
    rating: 5,
  },
  {
    name: "Diana K.",
    role: "Event Planner",
    text: "I recommend Leish! to all my clients. The quality of artists on this platform is unmatched, and the booking process is effortless.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-secondary py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-accent">
            Testimonials
          </p>
          <h2 className="mt-2 sm:mt-3 font-serif text-2xl sm:text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Loved by our clients
          </h2>
        </div>

        <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="border border-border bg-card p-6 sm:p-8 lg:p-10"
            >
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-accent text-accent"
                  />
                ))}
              </div>
              <p className="mt-4 sm:mt-6 text-sm leading-relaxed text-muted-foreground italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-4 sm:mt-6 border-t border-border pt-4">
                <p className="font-serif text-sm font-medium text-foreground">
                  {t.name}
                </p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
