import { z } from "zod"

import { getExternalStudioApiConfig } from "@/lib/env"
import type { Category, Studio } from "@/lib/data"
import type { StudioService } from "@/lib/services/types"

const ExternalPortfolioItemSchema = z.object({
  type: z.enum(["image", "beforeAfter", "video"]).default("image"),
  src: z.string(),
  alt: z.string().optional(),
  before: z.string().optional(),
  videoUrl: z.string().optional(),
})

const ExternalServiceSchema = z.object({
  name: z.string(),
  price: z.number(),
  duration: z.string(),
})

const ExternalTestimonialSchema = z.object({
  name: z.string(),
  text: z.string(),
  rating: z.number(),
})

const ExternalStudioArtistSchema = z.object({
  name: z.string(),
  role: z.string().default("Artist"),
  image: z.string().default("/images/malaysia/artist-1.jpg"),
})

const ExternalStudioSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string(),
  name: z.string(),
  image: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  location: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  startingPrice: z.number().optional(),
  bio: z.string().optional(),
  teamSize: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  portfolio: z.array(ExternalPortfolioItemSchema).optional(),
  services: z.array(ExternalServiceSchema).optional(),
  testimonials: z.array(ExternalTestimonialSchema).optional(),
  bookedSlots: z.record(z.string(), z.array(z.string())).optional(),
  artists: z.array(ExternalStudioArtistSchema).optional(),
})

const ExternalStudioListSchema = z.array(ExternalStudioSchema)
type ExternalStudio = z.infer<typeof ExternalStudioSchema>

const CATEGORY_VALUES = new Set<Category>([
  "Bridal",
  "Photoshoot",
  "Natural",
  "SFX",
  "Event",
])

function normalizeSpecialties(values?: string[]): Category[] {
  if (!values?.length) return ["Event"]

  const mapped = values
    .map((value) => value.trim())
    .map((value) => {
      const lower = value.toLowerCase()
      if (lower.includes("brid")) return "Bridal"
      if (lower.includes("photo") || lower.includes("editorial")) return "Photoshoot"
      if (lower.includes("natural")) return "Natural"
      if (lower.includes("sfx") || lower.includes("fx")) return "SFX"
      if (lower.includes("event")) return "Event"
      return value
    })
    .filter((value): value is Category => CATEGORY_VALUES.has(value as Category))

  return mapped.length > 0 ? mapped : ["Event"]
}

function toStudio(raw: ExternalStudio): Studio {
  return {
    id: String(raw.id),
    slug: raw.slug,
    name: raw.name,
    image: raw.image ?? "/images/malaysia/studio-1.jpg",
    specialties: normalizeSpecialties(raw.specialties),
    location: raw.location ?? "Malaysia",
    rating: raw.rating ?? 0,
    reviewCount: raw.reviewCount ?? 0,
    startingPrice: raw.startingPrice ?? 0,
    bio: raw.bio ?? "",
    teamSize: raw.teamSize ?? 1,
    amenities: raw.amenities ?? [],
    portfolio: (raw.portfolio ?? []).map((item) => ({
      type: item.type,
      src: item.src,
      alt: item.alt ?? `${raw.name} portfolio item`,
      before: item.before,
      videoUrl: item.videoUrl,
    })),
    services: raw.services ?? [],
    testimonials: raw.testimonials ?? [],
    bookedSlots: raw.bookedSlots ?? {},
    artists: raw.artists ?? [],
  }
}

async function fetchJson<S extends z.ZodTypeAny>(
  path: string,
  schema: S
): Promise<z.output<S>> {
  const config = getExternalStudioApiConfig()
  if (!config) {
    throw new Error("Missing external studio API configuration")
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`External studio API failed (${response.status})`)
  }

  const json = await response.json()
  return schema.parse(json)
}

export const externalStudioService: StudioService = {
  async list() {
    const rows = await fetchJson("/api/studios", ExternalStudioListSchema)
    return rows.map(toStudio)
  },

  async listByCategory(category) {
    if (category === "All") return this.list()

    const rows = await fetchJson(
      `/api/studios?category=${encodeURIComponent(category)}`,
      ExternalStudioListSchema
    )
    return rows.map(toStudio)
  },

  async getBySlug(slug) {
    const row = await fetchJson(`/api/studios/${encodeURIComponent(slug)}`, ExternalStudioSchema)
    return toStudio(row)
  },
}
