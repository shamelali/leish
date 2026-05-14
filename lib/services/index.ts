import {
  mockArtistService,
  mockBookingAvailabilityService,
  mockStudioService,
} from "@/lib/services/mock"
import { externalStudioService } from "@/lib/services/external-studios"
import { getExternalStudioApiConfig, getStudioSource } from "@/lib/env"
import {
  dbArtistService,
  dbBookingAvailabilityService,
  dbStudioService,
  bookingService,
} from "./db"

export * from "@/lib/services/types"

const useDb = process.env.USE_DB === "true"

export function getArtistService() {
  if (useDb) return dbArtistService
  return mockArtistService
}

export function getStudioService() {
  if (useDb) return dbStudioService
  if (getStudioSource() === "external" && getExternalStudioApiConfig()) {
    return externalStudioService
  }
  return mockStudioService
}

export function getBookingAvailabilityService() {
  if (useDb) return dbBookingAvailabilityService
  return mockBookingAvailabilityService
}

export function getBookingService() {
  if (useDb) return bookingService
  throw new Error("bookingService not available in mock mode")
}
