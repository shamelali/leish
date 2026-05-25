"use client"

import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type ArtistCardProps = {
  artist: {
    id: string
    name: string
    username: string
    avatar_url: string | null
    subscription_tier: string
    is_available: boolean
    rating: number | null
    review_count: number
  }
  reason: string
  onClickTrack?: (artistId: string) => void
}

export function ArtistCard({ artist, reason, onClickTrack }: ArtistCardProps) {
  return (
    <Link
      href={`/artists/${artist.username}`}
      onClick={() => onClickTrack?.(artist.id)}
      className="group flex items-start gap-3 border border-border bg-card p-3 transition-all hover:border-accent"
    >
      <div className="relative size-12 shrink-0 overflow-hidden border border-border">
        {artist.avatar_url ? (
          <Image src={artist.avatar_url} alt={artist.name} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-xs text-muted-foreground">
            {artist.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground group-hover:text-accent">
            {artist.name}
          </span>
          {artist.is_available && (
            <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">
              Available
            </span>
          )}
        </div>
        {artist.rating != null && (
          <div className="mt-0.5 flex items-center gap-1">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-muted-foreground">
              {artist.rating.toFixed(1)} ({artist.review_count})
            </span>
          </div>
        )}
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{reason}</p>
      </div>
    </Link>
  )
}
