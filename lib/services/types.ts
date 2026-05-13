import type { Artist, Category, Studio } from "@/lib/data"

export interface ArtistService {
  list(): Promise<Artist[]>
  listByCategory(category: Category | "All"): Promise<Artist[]>
  getBySlug(slug: string): Promise<Artist | undefined>
}

export interface StudioService {
  list(): Promise<Studio[]>
  listByCategory(category: Category | "All"): Promise<Studio[]>
  getBySlug(slug: string): Promise<Studio | undefined>
}

export interface BookingAvailabilityService {
  getArtistAvailableSlots(
    artistId: string,
    dateKey: string
  ): Promise<{ slot: string; available: boolean }[]>
  getStudioAvailableSlots(
    studioId: string,
    dateKey: string
  ): Promise<{ slot: string; available: boolean }[]>
  getProviderSlots?(providerId: string): Promise<AvailabilitySlot[]>
}

// additional backend services (only available when USE_DB=true)
export interface ProviderService {
  list(): Promise<Provider[]>
  getById(id: string): Promise<Provider | undefined>
  create(input: Partial<Provider> & { owner_id: string; kind: string }): Promise<Provider>
  update(id: string, updates: Partial<Provider>): Promise<void>
}

export interface ServiceService {
  listByProvider(providerId: string): Promise<Service[]>
  create(input: Partial<Service> & { provider_id: string }): Promise<Service>
  update(id: string, updates: Partial<Service>): Promise<void>
  delete(id: string): Promise<void>
}

export interface AvailabilityService {
  createSlot(slot: AvailabilitySlot): Promise<AvailabilitySlot>
  listByProviderAndDate(providerId: string, dateKey: string): Promise<AvailabilitySlot[]>
  deleteSlot(id: string): Promise<void>
}

export interface BookingService {
  create(payload: {
    customerId: string
    providerId: string
    serviceId: string
    slotId: string
    notes?: string
    totalAmountMyr: number
  }): Promise<{ id: string }>
  transition(
    bookingId: string,
    nextStatus: string,
    options?: { paidAmount?: number; slotId?: string }
  ): Promise<void>
}

// entity types
export interface Provider {
  id: string
  owner_id: string
  kind: string
  slug: string
  display_name: string
  state: string
  district: string
  is_active: boolean
}

export interface Service {
  id: string
  provider_id: string
  name: string
  duration_minutes: number
  price_myr: number
  is_active: boolean
}

export interface AvailabilitySlot {
  id: string
  provider_id: string
  starts_at: string
  ends_at: string
  is_booked: boolean
}

export interface Booking {
  id: string
  customer_id: string
  provider_id: string
  service_id: string
  slot_id: string
  status: string
  notes: string | null
  total_amount_myr: number
  paid_amount_myr: number
}
