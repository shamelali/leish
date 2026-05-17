export const dynamic = "force-dynamic"

import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
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
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
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
          <Link
            href="/studios/gallery"
            className="group inline-flex items-center gap-2 border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Browse spaces
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <Suspense fallback={<div className="text-muted-foreground">Loading studios...</div>}>
          <StudioGrid studios={studios} />
        </Suspense>
      </div>
    </section>
  )
}
