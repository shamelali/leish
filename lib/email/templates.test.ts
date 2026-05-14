import { describe, expect, it } from "vitest"
import {
  bookingConfirmationTemplate,
  welcomeEmailTemplate,
  shamelNotificationTemplate,
  paymentReceiptTemplate,
  bookingReminderTemplate,
} from "./templates"

describe("bookingConfirmationTemplate", () => {
  const params = {
    customerName: "Alice",
    bookingId: "BK-001",
    serviceName: "Bridal Makeup",
    providerName: "Sarah",
    date: "2026-06-15",
    time: "10:00 AM",
    amount: 500,
    paymentType: "full" as const,
  }

  it("returns subject, html, and text", () => {
    const result = bookingConfirmationTemplate(params)
    expect(result).toHaveProperty("subject")
    expect(result).toHaveProperty("html")
    expect(result).toHaveProperty("text")
  })

  it("subject contains booking ID", () => {
    expect(bookingConfirmationTemplate(params).subject).toContain("BK-001")
  })

  it("html contains customer name and provider name", () => {
    const html = bookingConfirmationTemplate(params).html
    expect(html).toContain("Alice")
    expect(html).toContain("Sarah")
    expect(html).toContain("Bridal Makeup")
  })

  it("text contains booking details", () => {
    const text = bookingConfirmationTemplate(params).text
    expect(text).toContain("Alice")
    expect(text).toContain("MYR 500")
    expect(text).toContain("Full Payment")
  })

  it("shows deposit label for deposit payment", () => {
    const deposit = bookingConfirmationTemplate({ ...params, paymentType: "deposit" })
    expect(deposit.html).toContain("30% Deposit")
    expect(deposit.text).toContain("30% Deposit")
  })

  it("shows full payment label for full payment", () => {
    const full = bookingConfirmationTemplate({ ...params, paymentType: "full" })
    expect(full.html).toContain("Full Payment")
    expect(full.text).toContain("Full Payment")
  })
})

describe("welcomeEmailTemplate", () => {
  it("returns subject, html, and text", () => {
    const result = welcomeEmailTemplate({ name: "Bob" })
    expect(result.subject).toBe("Welcome to Beaute!")
    expect(result.html).toContain("Bob")
    expect(result.text).toContain("Bob")
    expect(result.html).toContain("Explore Artists")
  })
})

describe("shamelNotificationTemplate", () => {
  it("generates a notification with name and message", () => {
    const result = shamelNotificationTemplate({
      name: "Shamel",
      message: "Test notification body",
    })
    expect(result.subject).toBe("Message for Shamel")
    expect(result.html).toContain("Shamel")
    expect(result.html).toContain("Test notification body")
    expect(result.text).toContain("Test notification body")
  })
})

describe("paymentReceiptTemplate", () => {
  const params = {
    customerName: "Alice",
    bookingId: "BK-001",
    amount: 500,
    paymentMethod: "Billplz",
    date: "2026-06-15",
  }

  it("returns subject, html, and text", () => {
    const result = paymentReceiptTemplate(params)
    expect(result.subject).toContain("BK-001")
    expect(result.html).toContain("MYR 500")
    expect(result.html).toContain("Billplz")
    expect(result.text).toContain("MYR 500")
    expect(result.text).toContain("Billplz")
  })
})

describe("bookingReminderTemplate", () => {
  const params = {
    customerName: "Alice",
    bookingId: "BK-001",
    serviceName: "Bridal Makeup",
    providerName: "Sarah",
    date: "2026-06-15",
    time: "10:00 AM",
  }

  it("returns subject, html, and text", () => {
    const result = bookingReminderTemplate(params)
    expect(result.subject).toContain("Reminder")
    expect(result.subject).toContain("BK-001")
    expect(result.html).toContain("Alice")
    expect(result.html).toContain("Sarah")
    expect(result.html).toContain("tomorrow")
  })

  it("includes location when provided", () => {
    const withLocation = bookingReminderTemplate({ ...params, location: "Kuala Lumpur" })
    expect(withLocation.html).toContain("Kuala Lumpur")
    expect(withLocation.text).toContain("Kuala Lumpur")
  })

  it("omits location section when not provided", () => {
    const withoutLocation = bookingReminderTemplate(params)
    expect(withoutLocation.html).not.toContain("Location:")
  })
})
