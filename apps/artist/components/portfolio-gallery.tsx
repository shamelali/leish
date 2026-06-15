"use client"

import type { PortfolioItem } from "@/lib/data"

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item, idx) => (
        <div key={idx} className="aspect-square overflow-hidden border border-border">
          <img src={item.src} alt={item.alt} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  )
}
