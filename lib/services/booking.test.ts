import { describe, expect, it, beforeAll, afterAll } from "vitest"
import { bookingSupabaseService } from "./booking-supabase"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "service-role-placeholder"
const runTests = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

// Test data (from seed_test_users.sql)
const TEST_CUSTOMER_ID = "22222222-2222-2222-2222-222222222222"
const TEST_PROVIDER_ID = "11111111-1111-1111-1111-111111111111"
const TEST_SERVICE_ID = "00000000-0000-0000-0000-000000000003"

/**
 * Integration tests for the booking flow
 * 
 * These tests verify:
 * 1. Booking creation with row locking
 * 2. 24-hour advance booking rule
 * 3. Double-booking prevention
 * 4. Booking status transitions
 * 5. Payment flow integration
 */
const describeIf = runTests ? describe : describe.skip

describeIf("Booking Integration Tests", () => {
  let supabase: SupabaseClient
  
  beforeAll(() => {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables")
    }
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  let testSlotId: string
  let testBookingId: string

  beforeAll(async () => {
    await supabase.from("profiles").upsert([
      { id: TEST_CUSTOMER_ID, full_name: "Sample Customer", role: "customer" as const },
      { id: TEST_PROVIDER_ID, full_name: "Artist Owner", role: "artist" as const },
    ], { onConflict: "id" })

    await supabase.from("services").upsert({
      id: TEST_SERVICE_ID,
      provider_id: TEST_PROVIDER_ID,
      name: "Test Makeup Service",
      price_myrm: 25000,
      duration_minutes: 60,
      is_active: true,
    }, { onConflict: "id" })

    // Create a test availability slot 48 hours in the future
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 48)
    futureDate.setMinutes(0)
    futureDate.setSeconds(0)
    futureDate.setMilliseconds(0)

    const slotEnd = new Date(futureDate.getTime() + 30 * 60 * 1000)

    const { data: slot, error } = await supabase
      .from("availability_slots")
      .insert({
        provider_id: TEST_PROVIDER_ID,
        starts_at: futureDate.toISOString(),
        ends_at: slotEnd.toISOString(),
        is_booked: false,
      })
      .select()
      .single()

    if (error) throw error
    testSlotId = slot.id
  })

  afterAll(async () => {
    // Cleanup
    if (testBookingId) {
      await supabase.from("booking_surcharges").delete().eq("booking_id", testBookingId)
      await supabase.from("booking_events").delete().eq("booking_id", testBookingId)
      await supabase.from("bookings").delete().eq("id", testBookingId)
    }
    if (testSlotId) {
      await supabase.from("availability_slots").delete().eq("id", testSlotId)
    }
  })

  describe("Booking Creation", () => {
    it("should create a booking successfully with valid data", async () => {
      const result = await bookingSupabaseService.create({
        customerId: TEST_CUSTOMER_ID,
        providerId: TEST_PROVIDER_ID,
        serviceId: TEST_SERVICE_ID,
        slotId: testSlotId,
        notes: "Test booking",
        totalAmountMyr: 25000, // RM 250.00
      })

      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe("string")
      testBookingId = result.id
    })

    it("should mark slot as booked after booking creation", async () => {
      const { data: slot } = await supabase
        .from("availability_slots")
        .select("is_booked")
        .eq("id", testSlotId)
        .single()

      expect(slot?.is_booked).toBe(true)
    })

    it("should create booking event audit log", async () => {
      const { data: events } = await supabase
        .from("booking_events")
        .select("*")
        .eq("booking_id", testBookingId)

      expect(events?.length).toBeGreaterThan(0)
      expect(events?.[0]?.event_type).toBe("booking_created")
    })
  })

  describe("Booking Validation Rules", () => {
    it("should reject booking less than 24 hours in advance", async () => {
      // Create a slot only 12 hours in the future
      const nearFutureDate = new Date()
      nearFutureDate.setHours(nearFutureDate.getHours() + 12)

      const { data: nearSlot } = await supabase
        .from("availability_slots")
        .insert({
          provider_id: TEST_PROVIDER_ID,
          starts_at: nearFutureDate.toISOString(),
          ends_at: new Date(nearFutureDate.getTime() + 30 * 60 * 1000).toISOString(),
          is_booked: false,
        })
        .select()
        .single()

      await expect(
        bookingSupabaseService.create({
          customerId: TEST_CUSTOMER_ID,
          providerId: TEST_PROVIDER_ID,
          serviceId: TEST_SERVICE_ID,
          slotId: nearSlot.id,
          totalAmountMyr: 25000,
        })
      ).rejects.toThrow("24 hours")

      // Cleanup
      await supabase.from("availability_slots").delete().eq("id", nearSlot.id)
    })

    it("should reject double-booking attempt", async () => {
      // Try to book the same slot again
      await expect(
        bookingSupabaseService.create({
          customerId: TEST_CUSTOMER_ID,
          providerId: TEST_PROVIDER_ID,
          serviceId: TEST_SERVICE_ID,
          slotId: testSlotId,
          totalAmountMyr: 25000,
        })
      ).rejects.toThrow("already booked")
    })

    it("should reject booking with non-existent slot", async () => {
      await expect(
        bookingSupabaseService.create({
          customerId: TEST_CUSTOMER_ID,
          providerId: TEST_PROVIDER_ID,
          serviceId: TEST_SERVICE_ID,
          slotId: "00000000-0000-0000-0000-000000000999",
          totalAmountMyr: 25000,
        })
      ).rejects.toThrow("Slot not found")
    })
  })

  describe("Booking Status Transitions", () => {
    it("should allow pending -> confirmed transition", async () => {
      const result = await bookingSupabaseService.transition(
        testBookingId,
        "confirmed"
      )

      expect(result.status).toBe("confirmed")
    })

    it("should allow confirmed -> paid_full transition", async () => {
      const result = await bookingSupabaseService.transition(
        testBookingId,
        "paid_full"
      )

      expect(result.status).toBe("paid_full")
    })

    it("should reject invalid transitions", async () => {
      // Cannot go from paid_full back to pending
      await expect(
        bookingSupabaseService.transition(testBookingId, "pending")
      ).rejects.toThrow("Invalid transition")
    })

    it("should create status change event", async () => {
      const { data: events } = await supabase
        .from("booking_events")
        .select("*")
        .eq("booking_id", testBookingId)
        .eq("event_type", "status_changed_to_paid_full")

      expect(events?.length).toBeGreaterThan(0)
    })
  })

  describe("Booking Cancellation", () => {
    it("should free up slot when booking is cancelled", async () => {
      // Create a new booking to cancel
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 72)

      const { data: cancelSlot } = await supabase
        .from("availability_slots")
        .insert({
          provider_id: TEST_PROVIDER_ID,
          starts_at: futureDate.toISOString(),
          ends_at: new Date(futureDate.getTime() + 30 * 60 * 1000).toISOString(),
          is_booked: false,
        })
        .select()
        .single()

      const { id: cancelBookingId } = await bookingSupabaseService.create({
        customerId: TEST_CUSTOMER_ID,
        providerId: TEST_PROVIDER_ID,
        serviceId: TEST_SERVICE_ID,
        slotId: cancelSlot.id,
        totalAmountMyr: 25000,
      })

      // Cancel the booking
      await bookingSupabaseService.transition(cancelBookingId, "canceled")

      // Verify slot is freed
      const { data: slot } = await supabase
        .from("availability_slots")
        .select("is_booked")
        .eq("id", cancelSlot.id)
        .single()

      expect(slot?.is_booked).toBe(false)

      // Cleanup
      await supabase.from("booking_events").delete().eq("booking_id", cancelBookingId)
      await supabase.from("bookings").delete().eq("id", cancelBookingId)
      await supabase.from("availability_slots").delete().eq("id", cancelSlot.id)
    })
  })

  describe("Service Resolution", () => {
    it("should resolve service by UUID", async () => {
      const resolvedId = await bookingSupabaseService.resolveServiceId(
        TEST_PROVIDER_ID,
        TEST_SERVICE_ID
      )

      expect(resolvedId).toBe(TEST_SERVICE_ID)
    })

    it("should resolve service by name", async () => {
      // First get a service name
      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", TEST_SERVICE_ID)
        .single()

      if (service) {
        const resolvedId = await bookingSupabaseService.resolveServiceId(
          TEST_PROVIDER_ID,
          service.name
        )

        expect(resolvedId).toBe(TEST_SERVICE_ID)
      }
    })

    it("should return null for non-existent service", async () => {
      const resolvedId = await bookingSupabaseService.resolveServiceId(
        TEST_PROVIDER_ID,
        "NonExistentService"
      )

      expect(resolvedId).toBeNull()
    })
  })
})

describe("Booking Flow End-to-End", () => {
  const canRun = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const itFn = canRun ? it : it.skip;
  itFn("should complete full booking lifecycle", async () => {
    // This test simulates the complete booking flow:
    // 1. Customer browses services
    // 2. Selects a time slot
    // 3. Creates booking
    // 4. Makes payment
    // 5. Booking confirmed
    // 6. Service completed

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Setup: Create slot
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 3)
    futureDate.setHours(10, 0, 0, 0)

    const { data: slot } = await supabase
      .from("availability_slots")
      .insert({
        provider_id: TEST_PROVIDER_ID,
        starts_at: futureDate.toISOString(),
        ends_at: new Date(futureDate.getTime() + 30 * 60 * 1000).toISOString(),
        is_booked: false,
      })
      .select()
      .single()

    // Step 1: Create booking
    const booking = await bookingSupabaseService.create({
      customerId: TEST_CUSTOMER_ID,
      providerId: TEST_PROVIDER_ID,
      serviceId: TEST_SERVICE_ID,
      slotId: slot.id,
      notes: "Bridal makeup trial",
      totalAmountMyr: 35000, // RM 350
    })

    expect(booking.id).toBeDefined()

    // Step 2: Provider confirms
    await bookingSupabaseService.transition(booking.id, "confirmed")

    // Step 3: Customer pays deposit
    await bookingSupabaseService.transition(booking.id, "paid_deposit")

    // Step 4: Customer pays full amount
    await bookingSupabaseService.transition(booking.id, "paid_full")

    // Step 5: Service completed
    await bookingSupabaseService.transition(booking.id, "completed")

    // Verify final state
    const finalBooking = await bookingSupabaseService.getById(booking.id)
    expect(finalBooking.status).toBe("completed")

    // Cleanup
    await supabase.from("booking_events").delete().eq("booking_id", booking.id)
    await supabase.from("bookings").delete().eq("id", booking.id)
    await supabase.from("availability_slots").delete().eq("id", slot.id)
  })
})
