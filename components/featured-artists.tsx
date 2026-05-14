import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, ArrowRight } from "lucide-react";
import { artists } from "@/lib/data";

export function FeaturedArtists() {
  const featured = artists.slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="bg-secondary py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-accent">
            Curated For You
          </p>
          <h2 className="mt-2 sm:mt-3 font-serif text-2xl sm:text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Featured artists
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Hand-selected artists known for exceptional craft and outstanding
            client experiences.
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          {featured.map((artist) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.slug}`}
              className="group overflow-hidden border border-border bg-card transition-all hover:border-accent hover:shadow-sm"
            >
              <div className="relative aspect-3/4 overflow-hidden">
                <Image
                  src={artist.image}
                  alt={`${artist.name}, makeup artist`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg sm:text-xl font-medium text-foreground truncate">
                      {artist.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="text-xs truncate">
                        {artist.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    <span className="text-sm font-medium text-foreground">
                      {artist.rating}
                    </span>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                  {artist.specialties.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="border border-border px-2 sm:px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-border pt-3 sm:pt-4">
                  <span className="text-sm text-muted-foreground">
                    From{" "}
                    <span className="font-medium text-foreground">
                      MYR {artist.hourlyRate}
                    </span>
                    /hr
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-foreground transition-colors">
                    View
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 text-center">
          <Link
            href="/artists"
            className="inline-flex items-center gap-2 border border-foreground px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-foreground transition-all hover:bg-foreground hover:text-primary-foreground"
          >
            See All Artists
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
