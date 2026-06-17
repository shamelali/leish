"use client"

import { Star, MapPin, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type Recommendation = {
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
}

export function ArtistCard({
  artist,
  reason,
  onClickTrack,
}: Recommendation & { onClickTrack?: (id: string) => void }) {
  const initials = artist.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card
      className="cursor-pointer overflow-hidden border-border bg-card p-3 transition-colors hover:border-primary"
      onClick={() => onClickTrack?.(artist.id)}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={artist.avatar_url || undefined} alt={artist.name} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{artist.name}</span>
            {artist.is_available && (
              <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                Available
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              {artist.rating ? `${artist.rating.toFixed(1)} (${artist.review_count})` : "No reviews"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              @{artist.username}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 shrink-0 text-accent" />
            <span className="italic">{reason}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
