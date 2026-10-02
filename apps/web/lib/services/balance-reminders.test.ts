import { describe, expect, it } from "vitest"
import { balanceReminderTemplate, outstandingBalance } from "./balance-reminders"

describe("outstandingBalance", () => {
  it("returns total minus paid", () => {
    expect(outstandingBalance(500, 150)).toBe(350)
  })

  it("rounds to sen and never goes negative", () => {
    expect(outstandingBalance(100.1, 50.05)).toBeCloseTo(50.05, 2)
    expect(outstandingBalance(100, 120)).toBe(0)
  })

  it("accepts numeric strings from the DB driver", () => {
    expect(outstandingBalance("300.00" as unknown as number, "90" as unknown as number)).toBe(210)
  })
})

describe("balanceReminderTemplate", () => {
  const base = {
    customerName: "Aisha",
    bookingId: "bk_1",
    serviceName: "Bridal Makeup",
    providerName: "Studio Glam",
    date: "Saturday, 10 October 2026",
    time: "10:00 am",
    balanceMyr: 350,
    payUrl: "https://www.leish.my/bookings/bk_1",
  }

  it("includes the amount and pay link", () => {
    const t = balanceReminderTemplate(base)
    expect(t.subject).toContain("Bridal Makeup")
    expect(t.html).toContain("RM 350.00")
    expect(t.text).toContain("RM 350.00")
    expect(t.text).toContain(base.payUrl)
  })

  it("escapes user-controlled values in HTML", () => {
    const t = balanceReminderTemplate({ ...base, customerName: "<script>x</script>" })
    expect(t.html).not.toContain("<script>")
    expect(t.html).toContain("&lt;script&gt;")
  })
})
