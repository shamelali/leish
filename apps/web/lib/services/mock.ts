import {
  artists,
  getArtistBySlug,
  getArtistsByCategory,
  getAvailableSlots,
  getStudioAvailableSlots,
  getStudioBySlug,
  getStudiosByCategory,
  studios,
} from "@/lib/data"
import type {
  ArtistService,
  BookingAvailabilityService,
  StudioService,
} from "@/lib/services/types"

export const mockArtistService: ArtistService = {
  async list() {
    return artists
  },
  async listByCategory(category) {
    return getArtistsByCategory(category)
  },
  async getBySlug(slug) {
    return getArtistBySlug(slug)
  },
}

export const mockStudioService: StudioService = {
  async list() {
    return studios
  },
  async listByCategory(category) {
    return getStudiosByCategory(category)
  },
  async getBySlug(slug) {
    return getStudioBySlug(slug)
  },
}

export const mockBookingAvailabilityService: BookingAvailabilityService = {
  async getArtistAvailableSlots(artistId, dateKey) {
    return getAvailableSlots(artistId, dateKey)
  },
  async getStudioAvailableSlots(studioId, dateKey) {
    return getStudioAvailableSlots(studioId, dateKey)
  },
  async getProviderSlots() {
    // fallback to empty list for mock
    return []
  },
}
