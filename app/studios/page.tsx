import { Suspense } from "react"
import { StudioGrid } from "@/components/studio-grid"
import { getStudios } from "@/lib/actions/studios"

export const metadata = {
  title: "Browse Studios | Leish!",
  description:
    "Discover elite beauty studios for weddings, events, and editorial shoots. Full-service teams, luxury amenities, and seamless booking.",
}

export default async function StudiosPage() {
  const studios = await getStudios()

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-12">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Our Studios
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Browse studios
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Full-service beauty studios with dedicated teams, luxury amenities,
            and the capacity to handle bridal parties and large-scale productions.
          </p>
        </div>

        <Suspense fallback={<div className="text-muted-foreground">Loading studios...</div>}>
          <StudioGrid studios={studios} />
        </Suspense>
      </div>
    </section>
  )
}
