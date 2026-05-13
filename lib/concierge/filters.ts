import { artists, type Artist, type Category } from "@/lib/data"
import type { ConversationContext, MatchSignal, Recommendation } from "./types"

// ── Keyword dictionaries ──────────────────────────────────────────────────────

const EVENT_KEYWORDS: Record<Category, string[]> = {
  Bridal: [
    "wedding", "bridal", "bride", "bridesmaids", "engagement",
    "nuptials", "ceremony", "matrimony", "nikah", "solemnization",
  ],
  Event: [
    "event", "gala", "party", "prom", "graduation", "ball",
    "dinner", "red carpet", "celebration", "corporate", "birthday",
    "reception", "banquet", "concert", "stage",
  ],
  Photoshoot: [
    "editorial", "photoshoot", "fashion", "magazine", "creative",
    "shoot", "campaign", "runway", "avant-garde", "portfolio",
    "lookbook", "commercial", "catalogue",
  ],
  Natural: [
    "natural", "soft glam", "minimal", "dewy", "fresh",
    "skin-first", "everyday", "no makeup", "clean", "simple",
    "subtle", "nude", "lit from within",
  ],
  SFX: [
    "sfx", "special effects", "prosthetic", "halloween", "fantasy",
    "character", "fx makeup", "theatrical", "costume", "body paint",
    "zombie", "monster", "creature",
  ],
  "Hari Raya": [
    "hari raya", "eid", "festive", "malay", "traditional", "modest",
    "elegant", "cultural", "celebration", "ramadan", "iftar",
  ],
  "Chinese New Year": [
    "chinese new year", "cny", "lunar new year", "auspicious", "red",
    "gold", "traditional chinese", "festive", "lion dance", "ang pow",
  ],
  "Traditional Malay": [
    "malay traditional", "berias pengantin", "henna", "bunga telur",
    "malay bridal", "cultural", "authentic", "adat", "tradisi",
  ],
  Hijab: [
    "hijab", "modest", "muslimah", "burqa", "niqab", "tudung",
    "islamic", "halal makeup", "covered", "abaya",
  ],
}

// City/state aliases → normalised location key
const LOCATION_KEYWORDS: Record<string, string[]> = {
  "Selangor, Petaling": [
    "selangor", "petaling", "petaling jaya", "pj", "subang",
    "shah alam", "klang", "damansara", "bangsar south",
  ],
  "Wilayah Persekutuan Kuala Lumpur, Bukit Bintang": [
    "kuala lumpur", "kl", "bukit bintang", "w.p. kuala lumpur",
    "wilayah persekutuan", "chow kit", "mont kiara", "bangsar",
    "midvalley", "klcc", "city centre",
  ],
  "Pulau Pinang, Timur Laut": [
    "pulau pinang", "penang", "timur laut", "george town",
    "georgetown", "bayan lepas", "gelugor",
  ],
  "Johor, Johor Bahru": [
    "johor", "johor bahru", "jb", "iskandar", "tebrau",
  ],
  "Sabah, Kota Kinabalu": [
    "sabah", "kota kinabalu", "kk", "likas", "damai",
  ],
  "Sarawak, Kuching": [
    "sarawak", "kuching", "miri", "sibu",
  ],
}

// Adjacent locations (partial matches give a proximity bonus)
const LOCATION_STATE: Record<string, string> = {
  "Selangor, Petaling": "Selangor",
  "Wilayah Persekutuan Kuala Lumpur, Bukit Bintang": "Klang Valley",
  "Pulau Pinang, Timur Laut": "Penang",
  "Johor, Johor Bahru": "Johor",
  "Sabah, Kota Kinabalu": "Sabah",
  "Sarawak, Kuching": "Sarawak",
}

// ── Parsers ───────────────────────────────────────────────────────────────────

export function parseEventTypes(text: string): Category[] {
  const lower = text.toLowerCase()
  const matches: Category[] = []
  for (const [category, keywords] of Object.entries(EVENT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matches.push(category as Category)
    }
  }
  return matches
}

export function parseLocation(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [location, keywords] of Object.entries(LOCATION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return location
    }
  }
  return null
}

export function parseBudget(text: string): { min: number; max: number } | null {
  // Match patterns like "MYR 300", "RM300", "$500", "300-600", "under 400"
  const rangeMatch = text.match(/(?:myr|rm|\$)?\s*(\d+)\s*[-–to]+\s*(?:myr|rm|\$)?\s*(\d+)/i)
  if (rangeMatch) {
    return {
      min: Math.min(parseInt(rangeMatch[1]), parseInt(rangeMatch[2])),
      max: Math.max(parseInt(rangeMatch[1]), parseInt(rangeMatch[2])),
    }
  }

  const underMatch = text.match(/under\s*(?:myr|rm|\$)?\s*(\d+)/i)
  if (underMatch) return { min: 0, max: parseInt(underMatch[1]) }

  const aboveMatch = text.match(/(?:above|over|from|min|starting)\s*(?:myr|rm|\$)?\s*(\d+)/i)
  if (aboveMatch) return { min: parseInt(aboveMatch[1]), max: 99999 }

  const singleMatch = text.match(/(?:myr|rm|\$)\s*(\d+)/i)
  if (singleMatch) return { min: 0, max: parseInt(singleMatch[1]) }

  if (/\baffordable\b|\bbudget\b|\bcheap\b|\blow.?cost\b/i.test(text)) return { min: 0, max: 300 }
  if (/\bluxury\b|\bpremium\b|\bhigh.?end\b|\bbest\b|\bexclusive\b|\btop\b/i.test(text)) return { min: 400, max: 99999 }
  if (/\bmid.?range\b|\bmodera/i.test(text)) return { min: 200, max: 500 }

  return null
}

export function parseExperienceYears(text: string): number {
  // "5 years", "10+ years", etc.
  const m = text.match(/(\d+)\+?\s*years?/i)
  if (m) return parseInt(m[1])
  if (/beginner|new|fresh/i.test(text)) return 0
  if (/veteran|senior|master|decade/i.test(text)) return 10
  return 0
}

// ── Ranker ────────────────────────────────────────────────────────────────────

interface RankInput {
  artist: Artist
  context: ConversationContext
}

function rankArtist({ artist, context }: RankInput): { score: number; signals: MatchSignal[]; reason: string } {
  const signals: MatchSignal[] = []

  // 1. Category / specialty match (30 pts per overlap)
  if (context.eventTypes.length > 0) {
    const overlap = artist.specialties.filter((s) => context.eventTypes.includes(s))
    if (overlap.length > 0) {
      const pts = overlap.length * 30
      signals.push({ label: `Specializes in ${overlap.join(" & ")}`, points: pts })
    }
  }

  // 2. Exact location match (25 pts)
  if (context.location && artist.location === context.location) {
    signals.push({ label: `Based in ${artist.location}`, points: 25 })
  } else if (context.location) {
    // Proximity: same state/region (10 pts)
    const wantedState = LOCATION_STATE[context.location]
    const artistState = LOCATION_STATE[artist.location]
    if (wantedState && artistState && wantedState === artistState) {
      signals.push({ label: `Near ${context.location.split(",")[0]}`, points: 10 })
    }
  }

  // 3. Budget match (15 pts if min service price within range)
  if (context.budget) {
    const minPrice = Math.min(...artist.services.map((s) => s.price))
    if (minPrice <= context.budget.max) {
      if (minPrice >= context.budget.min * 0.6) {
        signals.push({ label: `Starting from MYR ${minPrice}`, points: 15 })
      } else {
        // Well within budget — still a positive signal (8 pts)
        signals.push({ label: `Starting from MYR ${minPrice}`, points: 8 })
      }
    }
  }

  // 4. Rating bonus
  if (artist.rating >= 4.9) {
    signals.push({ label: `${artist.rating}★ rating`, points: 10 })
  } else if (artist.rating >= 4.7) {
    signals.push({ label: `${artist.rating}★ rating`, points: 5 })
  }

  // 5. Social proof (review count, up to 5 pts)
  if (artist.reviewCount >= 50) {
    signals.push({ label: `${artist.reviewCount} reviews`, points: 5 })
  } else if (artist.reviewCount >= 20) {
    signals.push({ label: `${artist.reviewCount} reviews`, points: 3 })
  }

  // 6. Experience bonus (up to 10 pts)
  const expYears = parseExperienceYears(artist.experience)
  if (expYears >= 8) {
    signals.push({ label: artist.experience, points: 10 })
  } else if (expYears >= 4) {
    signals.push({ label: artist.experience, points: 5 })
  } else if (expYears >= 1) {
    signals.push({ label: artist.experience, points: 2 })
  }

  // 7. Style notes keyword match (5 pts per match up to 10)
  if (context.styleNotes.length > 0) {
    const allNotes = context.styleNotes.join(" ").toLowerCase()
    const bioLower = (artist.bio + " " + artist.specialties.join(" ")).toLowerCase()
    const styleHits = context.styleNotes.filter((note) =>
      note.split(" ").some((word) => word.length > 3 && bioLower.includes(word.toLowerCase()))
    )
    if (styleHits.length > 0) {
      signals.push({ label: `Matches your style preferences`, points: Math.min(styleHits.length * 5, 10) })
    }
    void allNotes // suppress unused warning
  }

  // 8. Base presence score
  signals.push({ label: "Listed artist", points: 5 })

  const score = signals.reduce((sum, s) => sum + s.points, 0)
  const topSignals = signals
    .filter((s) => s.points >= 5)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
  const reason =
    topSignals.length > 0 ? topSignals.map((s) => s.label).join(" · ") : `${artist.experience} of experience`

  return { score, signals, reason }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Minimum score for an artist to be included in results */
const MIN_SCORE = 15

/** Maximum recommendations to return */
const MAX_RESULTS = 3

export function rankArtists(context: ConversationContext): Recommendation[] {
  const results = artists.map((artist) => {
    const { score, signals, reason } = rankArtist({ artist, context })
    return { artist, score, signals, reason }
  })

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .filter((r) => r.score >= MIN_SCORE)
}
