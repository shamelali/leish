"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Star, MapPin, ArrowRight, Users } from "lucide-react";
import type { Category } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { StudioListItem } from "@/lib/actions/studios";

const filters: (Category | "All")[] = [
  "All",
  "Bridal",
  "Event",
  "Natural",
  "Photoshoot",
  "SFX",
];

interface StudioGridProps {
  studios: StudioListItem[];
}

export function StudioGrid({ studios }: StudioGridProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") as Category | null;
  const [state, setState] = useState<string>("All");
  const [district, setDistrict] = useState<string>("All");
  const [active, setActive] = useState<Category | "All">(
    initialCategory && filters.includes(initialCategory)
      ? initialCategory
      : "All",
  );

  const states = useMemo(() => {
    const stateSet = new Set(studios.map((s) => s.state));
    return Array.from(stateSet).sort();
  }, [studios]);

  const districts = useMemo(() => {
    return Array.from(
      new Set(
        studios
          .filter((s) => state === "All" || s.state === state)
          .map((s) => s.district)
          .filter(Boolean),
      ),
    ).sort();
  }, [studios, state]);

  const filtered = useMemo(() => {
    return studios.filter((s) => {
      const categoryMatch = active === "All" || s.specialties.includes(active);
      const stateMatch = state === "All" || s.state === state;
      const districtMatch = district === "All" || s.district === district;
      return categoryMatch && stateMatch && districtMatch;
    });
  }, [studios, active, state, district]);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-3">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={cn(
              "min-h-[44px] px-5 py-2.5 text-xs font-medium uppercase tracking-widest transition-all",
              active === f
                ? "border border-foreground bg-foreground text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setDistrict("All");
          }}
          className="min-h-[44px] border border-border bg-card px-4 text-xs font-medium uppercase tracking-widest text-foreground focus:border-accent focus:outline-none"
          aria-label="Filter by state"
        >
          <option value="All">All States</option>
          {states.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="min-h-[44px] border border-border bg-card px-4 text-xs font-medium uppercase tracking-widest text-foreground focus:border-accent focus:outline-none"
          aria-label="Filter by district"
        >
          <option value="All">All Districts</option>
          {districts.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        {filtered.map((studio) => (
          <Link
            key={studio.id}
            href={`/studios/${studio.slug}`}
            className="group overflow-hidden border border-border bg-card transition-all hover:border-accent hover:shadow-sm"
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={studio.image}
                alt={`${studio.name}, beauty studio`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Team size badge */}
              <div className="absolute right-4 top-4 flex items-center gap-1.5 border border-border/30 bg-card/90 px-3 py-1.5 backdrop-blur-sm">
                <Users className="h-3 w-3 text-accent" />
                <span className="text-xs font-medium text-foreground">
                  {studio.teamSize} Artists
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground">
                    {studio.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">{studio.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    {studio.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({studio.reviewCount})
                  </span>
                </div>
              </div>

              {studio.bio && (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {studio.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {studio.specialties.map((s) => (
                  <span
                    key={s}
                    className="border border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Amenities preview */}
              {studio.amenities && studio.amenities.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {studio.amenities.slice(0, 3).map((a) => (
                    <span
                      key={a}
                      className="bg-secondary px-2.5 py-1 text-[10px] text-muted-foreground"
                    >
                      {a}
                    </span>
                  ))}
                  {studio.amenities.length > 3 && (
                    <span className="bg-secondary px-2.5 py-1 text-[10px] text-accent">
                      +{studio.amenities.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">
                  From{" "}
                  <span className="font-medium text-foreground">
                    MYR {studio.startingPrice}
                  </span>
                  /session
                </span>
                <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-foreground transition-colors">
                  View Studio
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="font-serif text-xl text-muted-foreground">
            No studios found for this filter.
          </p>
        </div>
      )}
    </div>
  );
}
