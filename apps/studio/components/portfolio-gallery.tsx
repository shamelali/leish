"use client"

import Image from "next/image"
import { Play } from "lucide-react"

interface PortfolioItem {
  type: string
  src: string
  alt: string
  before?: string
}

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  if (!items.length) return null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <div key={i} className="group relative aspect-4/3 overflow-hidden border border-border bg-card">
          {item.type === "video" ? (
            <div className="relative flex h-full items-center justify-center bg-muted">
              <Play className="h-12 w-12 text-muted-foreground" />
              <span className="sr-only">{item.alt}</span>
            </div>
          ) : (
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          {item.alt && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="text-xs text-white">{item.alt}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
