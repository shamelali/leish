"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const billId = searchParams.get("bill_id")
  const status = searchParams.get("status")
  const [bookingRef, setBookingRef] = useState<string | null>(null)

  useEffect(() => {
    if (!billId) return
    let cancelled = false
    fetch(`/api/payments/status?billId=${encodeURIComponent(billId)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data?.bookingId) setBookingRef(data.bookingId)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [billId])

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center border-2 border-accent">
        <Check className="h-10 w-10 text-accent" />
      </div>
      <h1 className="mt-6 font-serif text-3xl font-medium">Payment Successful</h1>
      <p className="mt-3 text-muted-foreground">
        {status === "failed"
          ? "Your payment was not completed. Please try again."
          : "Your payment has been processed successfully."}
      </p>

      {bookingRef && (
        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
          Booking Reference: {bookingRef}
        </p>
      )}

      {!billId && (
        <p className="mt-4 text-sm text-muted-foreground">
          No payment reference found. If you&apos;ve just completed a payment, your booking is being processed.
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/"
          className="border border-foreground px-6 py-3 text-xs font-medium uppercase tracking-widest transition-all hover:bg-foreground hover:text-primary-foreground"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
