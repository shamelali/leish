"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Star,
  MapPin,
  ArrowRight,
  SlidersHorizontal,
  Heart,
} from "lucide-react";
import type { Category } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { ArtistListItem } from "@/lib/actions/artists";
import { toggleFavorite } from "@/lib/actions/favorites";
import { ComingSoon } from "@/components/coming-soon";

const filters: (Category | "All")[] = [
  "All",
  "Bridal",
  "Event",
  "Natural",
  "Photoshoot",
  "SFX",
];

interface ArtistGridProps {
  artists: ArtistListItem[];
  favorites?: string[];
}

export function ArtistGrid({ artists, favorites = [] }: ArtistGridProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") as Category | null;
  const [state, setState] = useState<string>("All");
  const [district, setDistrict] = useState<string>("All");
  const [active, setActive] = useState<Category | "All">(
    initialCategory && filters.includes(initialCategory)
      ? initialCategory
      : "All",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(
    new Set(favorites),
  );
  const [toggling, setToggling] = useState<string | null>(null);

  const states = useMemo(() => {
    const stateSet = new Set(artists.map((a) => a.state));
    return Array.from(stateSet).sort();
  }, [artists]);

  const stateCounts = useMemo(() => {
    return states.map((item) => ({
      state: item,
      count: artists.filter((a) => a.state === item).length,
    }));
  }, [states, artists]);

  const districts = useMemo(() => {
    return Array.from(
      new Set(
        artists
          .filter((a) => state === "All" || a.state === state)
          .map((a) => a.district)
          .filter(Boolean),
      ),
    ).sort();
  }, [artists, state]);

  const filtered = useMemo(() => {
    return artists.filter((a) => {
      const categoryMatch = active === "All" || a.specialties.includes(active);
      const stateMatch = state === "All" || a.state === state;
      const districtMatch = district === "All" || a.district === district;
      const priceMatch =
        a.hourlyRate >= priceRange[0] && a.hourlyRate <= priceRange[1];
      const ratingMatch = a.rating >= minRating;
      return (
        categoryMatch &&
        stateMatch &&
        districtMatch &&
        priceMatch &&
        ratingMatch
      );
    });
  }, [artists, active, state, district, priceRange, minRating]);

  const handleToggleFavorite = async (
    e: React.MouseEvent,
    artistId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;

    setToggling(artistId);
    const isFavorited = favoritedIds.has(artistId);
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (isFavorited) {
        next.delete(artistId);
      } else {
        next.add(artistId);
      }
      return next;
    });

    try {
      await toggleFavorite(artistId);
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (isFavorited) {
          next.add(artistId);
        } else {
          next.delete(artistId);
        }
        return next;
      });
    } finally {
      setToggling(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Showing {filtered.length} of {artists.length} artists
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex min-h-11 items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-widest transition-all",
              showFilters
                ? "border-foreground bg-foreground text-primary-foreground"
                : "border-border text-muted-foreground hover:border-accent hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filters
          </button>
          <button
            type="button"
            onClick={() => {
              setActive("All");
              setState("All");
              setDistrict("All");
              setPriceRange([0, 1000]);
              setMinRating(0);
            }}
            className="flex min-h-11 items-center border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
          >
            Reset Filters
          </button>
        </div>

        {/* Price & Rating Filters - collapsible */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Price & Rating
            </p>

            {/* Price Range */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                Price: MYR {priceRange[0]} - {priceRange[1]}+
              </p>
              <div className="flex gap-2">
                {[0, 100, 200, 300, 500].map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setPriceRange([price, price + 100])}
                    className={cn(
                      "min-h-9 border px-2 py-1.5 text-[10px] transition-all",
                      priceRange[0] === price
                        ? "border-foreground bg-foreground text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-accent",
                    )}
                  >
                    {price === 0 ? "<100" : `${price}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Minimum Rating:{" "}
                {minRating === 0 ? "Any" : `${minRating}+ stars`}
              </p>
              <div className="flex gap-2">
                {[0, 3, 4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setMinRating(rating)}
                    className={cn(
                      "flex min-h-9 items-center gap-1 border px-2 py-1.5 text-[10px] transition-all",
                      minRating === rating
                        ? "border-foreground bg-foreground text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-accent",
                    )}
                  >
                    <Star
                      className={cn("h-3 w-3", rating > 0 && "fill-current")}
                    />
                    {rating === 0 ? "Any" : `${rating}+`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Location Filter Section */}
      <div className="mb-6 border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Filter by Location
          </p>
          {state !== "All" && (
            <button
              type="button"
              onClick={() => {
                setState("All");
                setDistrict("All");
              }}
              className="text-[10px] text-accent hover:underline"
            >
              Clear location
            </button>
          )}
        </div>

        {/* States */}
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-2">
            States
          </p>
          <div className="flex flex-wrap gap-2">
              {stateCounts.length > 0 ? (
                stateCounts.map((item) => (
                  <button
                    key={item.state}
                    type="button"
                    onClick={() => {
                      setState(item.state);
                      setDistrict("All");
                    }}
                    className={cn(
                      "min-h-11 border px-3 py-2 text-[10px] uppercase tracking-widest transition-all",
                      state === item.state
                        ? "border-foreground bg-foreground text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-accent hover:text-foreground",
                    )}
                  >
                    {item.state}
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No states available
                </p>
              )}
          </div>
        </div>

        {/* Districts - shown when state is selected */}
        {state !== "All" && districts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-2">
              Districts in {state}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDistrict("All")}
                className={cn(
                  "min-h-11 border px-3 py-2 text-[10px] uppercase tracking-widest transition-all",
                  district === "All"
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-accent hover:text-foreground",
                )}
              >
                All Districts
              </button>
              {districts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDistrict(d)}
                  className={cn(
                    "min-h-11 border px-3 py-2 text-[10px] uppercase tracking-widest transition-all",
                    district === d
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-accent hover:text-foreground",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Filter tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={cn(
              "min-h-11 px-3 sm:px-5 py-2.5 text-[10px] sm:text-xs font-medium uppercase tracking-widest transition-all",
              active === f
                ? "border border-foreground bg-foreground text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((artist) => (
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
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <button
                type="button"
                onClick={(e) => handleToggleFavorite(e, artist.id)}
                disabled={toggling === artist.id}
                className={cn(
                  "absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full p-2.5 transition-all hover:scale-110 active:scale-95",
                  favoritedIds.has(artist.id)
                    ? "bg-red-500/90 text-white hover:bg-red-500"
                    : "bg-white/80 text-muted-foreground hover:bg-white hover:text-red-500",
                )}
                aria-label={
                  favoritedIds.has(artist.id)
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-all",
                    favoritedIds.has(artist.id) && "fill-current",
                  )}
                />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-lg sm:text-xl font-medium text-foreground truncate">
                    {artist.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="text-xs truncate">{artist.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    {artist.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({artist.reviewCount})
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

      {filtered.length === 0 && artists.length === 0 ? (
        <ComingSoon />
      ) : (
        filtered.length === 0 && (
          <div className="mt-16 text-center">
            <p className="font-serif text-xl text-muted-foreground">
              No artists found for this filter.
            </p>
          </div>
        )
      )}
    </div>
  );
}
