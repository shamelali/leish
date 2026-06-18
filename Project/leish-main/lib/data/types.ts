export type Category = "Bridal" | "Photoshoot" | "Natural" | "SFX" | "Event" | "Hari Raya" | "Chinese New Year" | "Traditional Malay" | "Hijab"

export type PortfolioItemType = "image" | "beforeAfter" | "video"

export interface PortfolioItem {
  type: PortfolioItemType
  src: string
  alt: string
  before?: string
  videoUrl?: string
}

export interface Artist {
  id: string
  name: string
  slug: string
  image: string
  specialties: Category[]
  location: string
  rating: number
  reviewCount: number
  hourlyRate: number
  bio: string
  experience: string
  portfolio: PortfolioItem[]
  services: { name: string; price: number; duration: string }[]
  testimonials: { name: string; text: string; rating: number }[]
  bookedSlots: Record<string, string[]>
}

export interface Studio {
  id: string
  name: string
  slug: string
  image: string
  specialties: Category[]
  location: string
  rating: number
  reviewCount: number
  startingPrice: number
  bio: string
  teamSize: number
  amenities: string[]
  portfolio: PortfolioItem[]
  services: { name: string; price: number; duration: string }[]
  testimonials: { name: string; text: string; rating: number }[]
  bookedSlots: Record<string, string[]>
  artists: { name: string; role: string; image: string }[]
}
