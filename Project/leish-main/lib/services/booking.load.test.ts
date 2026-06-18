/**
 * Load Tests for Concurrent Booking Operations
 * 
 * These tests verify the system can handle concurrent booking attempts
 * without double-booking or race conditions.
 */
import { describe, expect, it, beforeAll } from "vitest"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Skip tests if environment variables are not set
const runTests = supabaseUrl && supabaseServiceKey

const TEST_PROVIDER_ID = "00000000-0000-0000-0000-000000000002"
const TEST_SERVICE_ID = "00000000-0000-0000-0000-000000000003"

const describeIf = runTests ? describe : describe.skip

describeIf("Booking Load Tests", () => {
  let supabase: SupabaseClient
  
  beforeAll(() => {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables")
    }
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

  it("should handle 10 concurrent booking attempts on same slot (only 1 succeeds)", async () => {
    // Create a single slot
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 2)
    futureDate.setHours(14, 0, 0, 0)

    const { data: slot, error } = await supabase
      .from("availability_slots")
      .insert({
        provider_id: TEST_PROVIDER_ID,
        starts_at: futureDate.toISOString(),
        ends_at: new Date(futureDate.getTime() + 30 * 60 * 1000).toISOString(),
        is_booked: false,
      })
      .select()
      .single()

    if (error) throw error

    // Attempt 10 concurrent bookings
    const attempts = Array.from({ length: 10 }, (_, i) => ({
      customerId: `00000000-0000-0000-0000-0000000000${10 + i}`,
      attempt: i + 1,
    }))

    const results = await Promise.allSettled(
      attempts.map(({ customerId }) =>
        supabase.rpc("create_booking_with_lock", {
          p_customer_id: customerId,
          p_provider_id: TEST_PROVIDER_ID,
          p_service_id: TEST_SERVICE_ID,
          p_slot_id: slot.id,
          p_notes: `Load test attempt`,
          p_total_amount_myr: 25000,
        })
      )
    )

    // Count successes and failures
    const successes = results.filter((r) => r.status === "fulfilled" && !r.value.error).length
    const failures = results.filter((r) => r.status === "rejected" || r.value.error).length

    // Only 1 should succeed due to row locking
    expect(successes).toBe(1)
    expect(failures).toBe(9)

    // Verify slot is marked as booked
    const { data: finalSlot } = await supabase
      .from("availability_slots")
      .select("is_booked")
      .eq("id", slot.id)
      .single()

    expect(finalSlot?.is_booked).toBe(true)

    // Cleanup: Get the successful booking and clean up
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("slot_id", slot.id)

    if (bookings) {
      for (const booking of bookings) {
        await supabase.from("booking_events").delete().eq("booking_id", booking.id)
        await supabase.from("bookings").delete().eq("id", booking.id)
      }
    }
    await supabase.from("availability_slots").delete().eq("id", slot.id)
  })

  it("should handle 50 concurrent bookings on different slots", async () => {
    // Create 50 slots
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() + 2)
    baseDate.setHours(9, 0, 0, 0)

    const slots = await Promise.all(
      Array.from({ length: 50 }, async (_, i) => {
        const slotTime = new Date(baseDate.getTime() + i * 30 * 60 * 1000)
        const { data: slot } = await supabase
          .from("availability_slots")
          .insert({
            provider_id: TEST_PROVIDER_ID,
            starts_at: slotTime.toISOString(),
            ends_at: new Date(slotTime.getTime() + 30 * 60 * 1000).toISOString(),
            is_booked: false,
          })
          .select()
          .single()
        return slot
      })
    )

    // Attempt 50 concurrent bookings (one per slot)
    const results = await Promise.allSettled(
      slots.map((slot, i) =>
        supabase.rpc("create_booking_with_lock", {
          p_customer_id: `00000000-0000-0000-0000-00000000${String(i + 1).padStart(3, "0")}`,
          p_provider_id: TEST_PROVIDER_ID,
          p_service_id: TEST_SERVICE_ID,
          p_slot_id: slot!.id,
          p_notes: `Concurrent booking ${i + 1}`,
          p_total_amount_myr: 25000 + i * 100,
        })
      )
    )

    // All should succeed since they're on different slots
    const successes = results.filter((r) => r.status === "fulfilled" && !r.value.error).length
    expect(successes).toBe(50)

    // Cleanup
    const slotIds = slots.map((s) => s!.id)
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .in("slot_id", slotIds)

    if (bookings) {
      const bookingIds = bookings.map((b) => b.id)
      await supabase.from("booking_events").delete().in("booking_id", bookingIds)
      await supabase.from("bookings").delete().in("id", bookingIds)
    }
    await supabase.from("availability_slots").delete().in("id", slotIds)
  }, 30000) // 30 second timeout

  it("should handle rapid sequential bookings without race conditions", async () => {
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() + 2)
    baseDate.setHours(16, 0, 0, 0)

    const slotIds: string[] = []
    const bookingIds: string[] = []

    // Create 20 slots and book them rapidly
    for (let i = 0; i < 20; i++) {
      const slotTime = new Date(baseDate.getTime() + i * 30 * 60 * 1000)
      
      // Create slot
      const { data: slot } = await supabase
        .from("availability_slots")
        .insert({
          provider_id: TEST_PROVIDER_ID,
          starts_at: slotTime.toISOString(),
          ends_at: new Date(slotTime.getTime() + 30 * 60 * 1000).toISOString(),
          is_booked: false,
        })
        .select()
        .single()

      slotIds.push(slot!.id)

      // Book immediately
      const { data: bookingId, error } = await supabase.rpc("create_booking_with_lock", {
        p_customer_id: `00000000-0000-0000-0000-00000000${String(i + 100).padStart(3, "0")}`,
        p_provider_id: TEST_PROVIDER_ID,
        p_service_id: TEST_SERVICE_ID,
        p_slot_id: slot!.id,
        p_notes: `Rapid booking ${i + 1}`,
        p_total_amount_myr: 25000,
      })

      expect(error).toBeNull()
      expect(bookingId).toBeDefined()
      bookingIds.push(bookingId)
    }

    // Verify all slots are booked
    const { data: slots } = await supabase
      .from("availability_slots")
      .select("is_booked")
      .in("id", slotIds)

    expect(slots?.every((s) => s.is_booked)).toBe(true)

    // Cleanup
    await supabase.from("booking_events").delete().in("booking_id", bookingIds)
    await supabase.from("bookings").delete().in("id", bookingIds)
    await supabase.from("availability_slots").delete().in("id", slotIds)
  }, 30000)

  it("should maintain data consistency under load", async () => {
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() + 3)
    baseDate.setHours(10, 0, 0, 0)

    // Create a slot
    const { data: slot } = await supabase
      .from("availability_slots")
      .insert({
        provider_id: TEST_PROVIDER_ID,
        starts_at: baseDate.toISOString(),
        ends_at: new Date(baseDate.getTime() + 30 * 60 * 1000).toISOString(),
        is_booked: false,
      })
      .select()
      .single()

    // Fire 20 concurrent requests
    const promises = Array.from({ length: 20 }, (_, i) =>
      supabase.rpc("create_booking_with_lock", {
        p_customer_id: `00000000-0000-0000-0000-00000000${String(i + 200).padStart(3, "0")}`,
        p_provider_id: TEST_PROVIDER_ID,
        p_service_id: TEST_SERVICE_ID,
        p_slot_id: slot!.id,
        p_notes: `Consistency test ${i + 1}`,
        p_total_amount_myr: 25000,
      })
    )

    await Promise.allSettled(promises)

    // Verify only one booking exists for this slot
    const { data: bookings, count } = await supabase
      .from("bookings")
      .select("*", { count: "exact" })
      .eq("slot_id", slot!.id)

    expect(count).toBe(1)

    // Verify the slot is booked
    const { data: finalSlot } = await supabase
      .from("availability_slots")
      .select("is_booked")
      .eq("id", slot!.id)
      .single()

    expect(finalSlot?.is_booked).toBe(true)

    // Cleanup
    if (bookings) {
      const bookingIds = bookings.map((b) => b.id)
      await supabase.from("booking_events").delete().in("booking_id", bookingIds)
      await supabase.from("bookings").delete().in("id", bookingIds)
    }
    await supabase.from("availability_slots").delete().eq("id", slot!.id)
  })
})
})
