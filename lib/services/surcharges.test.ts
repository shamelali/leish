import { describe, expect, it } from "vitest"
import { surchargeService, surchargePresets } from "./surcharges"

describe("surchargePresets", () => {
  it("earlyMorning surcharge applies before 7 AM", () => {
    expect(surchargePresets.earlyMorning.appliesBeforeHour).toBe(7)
    expect(surchargePresets.earlyMorning.amountMyr).toBe(100)
  })

  it("lateNight surcharge applies after 9 PM", () => {
    expect(surchargePresets.lateNight.appliesAfterHour).toBe(21)
    expect(surchargePresets.lateNight.amountMyr).toBe(100)
  })

  it("weekend surcharge applies to Saturday and Sunday", () => {
    expect(surchargePresets.weekend.appliesToDays).toEqual([0, 6])
    expect(surchargePresets.weekend.amountMyr).toBe(50)
  })

  it("publicHoliday is a percentage surcharge", () => {
    expect(surchargePresets.publicHoliday.surchargeType).toBe("percentage")
    expect(surchargePresets.publicHoliday.percentage).toBe(50)
  })

  it("lastMinute applies within 48 hours", () => {
    expect(surchargePresets.lastMinute.minAdvanceBookingHours).toBe(48)
    expect(surchargePresets.lastMinute.amountMyr).toBe(100)
  })

  it("additionalPerson is per-person type", () => {
    expect(surchargePresets.additionalPerson.surchargeType).toBe("per_person")
    expect(surchargePresets.additionalPerson.amountMyr).toBe(150)
  })

  it("all presets have required fields", () => {
    for (const [key, preset] of Object.entries(surchargePresets)) {
      expect(preset.name).toBeTruthy()
      expect(preset.description).toBeTruthy()
      expect(["fixed", "percentage", "per_km", "per_person"]).toContain(preset.surchargeType)
    }
  })
})

describe("mapRowToSurcharge", () => {
  it("maps a complete row correctly", () => {
    const row = {
      id: "abc-123",
      provider_id: "prov-1",
      name: "Early Morning",
      description: "Before 7 AM fee",
      surcharge_type: "fixed",
      amount_myr: 100,
      percentage: 0,
      is_active: true,
      applies_to_days: [],
      applies_before_hour: 7,
      applies_after_hour: null,
      min_advance_booking_hours: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    }

    const result = surchargeService.mapRowToSurcharge(row)

    expect(result.id).toBe("abc-123")
    expect(result.providerId).toBe("prov-1")
    expect(result.name).toBe("Early Morning")
    expect(result.surchargeType).toBe("fixed")
    expect(result.amountMyr).toBe(100)
    expect(result.appliesBeforeHour).toBe(7)
    expect(result.appliesAfterHour).toBeNull()
  })

  it("handles null description", () => {
    const result = surchargeService.mapRowToSurcharge({
      id: "x", provider_id: "p", name: "Test", surcharge_type: "fixed",
      amount_myr: 0, percentage: 0, is_active: true, applies_to_days: [],
      applies_before_hour: null, applies_after_hour: null,
      min_advance_booking_hours: null, description: null,
      created_at: "", updated_at: "",
    })
    expect(result.description).toBeNull()
  })
})

describe("mapRowToBookingSurcharge", () => {
  it("maps a booking surcharge row correctly", () => {
    const row = {
      id: "bs-1",
      booking_id: "b-1",
      surcharge_id: "s-1",
      name: "Weekend Fee",
      amount_myr: 50,
      reason: "Saturday booking",
      created_at: "2026-01-01T00:00:00Z",
    }

    const result = surchargeService.mapRowToBookingSurcharge(row)

    expect(result.id).toBe("bs-1")
    expect(result.bookingId).toBe("b-1")
    expect(result.surchargeId).toBe("s-1")
    expect(result.name).toBe("Weekend Fee")
    expect(result.amountMyr).toBe(50)
    expect(result.reason).toBe("Saturday booking")
  })

  it("handles null surchargeId", () => {
    const result = surchargeService.mapRowToBookingSurcharge({
      id: "bs-2", booking_id: "b-2", surcharge_id: null,
      name: "Custom Fee", amount_myr: 25, reason: null, created_at: "",
    })
    expect(result.surchargeId).toBeNull()
    expect(result.reason).toBeNull()
  })
})
