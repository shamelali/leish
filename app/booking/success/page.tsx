"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/language-context"

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const { lang } = useTranslation()
  const searchParams = useSearchParams()

  useEffect(() => {
    const billplzBillId = searchParams.get("billplz[id]")
    const billplzPaid = searchParams.get("billplz[paid]")
    const bookingId = searchParams.get("booking_id")

    // Billplz redirects with billplz[paid]=true on success
    if (billplzPaid === "true") {
      setStatus("success")
      return
    }

    // If we have a bill ID, verify server-side
    if (billplzBillId || bookingId) {
      const id = billplzBillId || bookingId
      fetch(`/api/payments/status?id=${id}`)
        .then((r) => r.json())
        .then((data) => {
          setStatus(data.paid ? "success" : "error")
        })
        .catch(() => setStatus("error"))
      return
    }

    // No payment params — assume success (direct nav or HitPay redirect)
    setStatus("success")
  }, [searchParams])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium text-foreground mb-2">
            {lang === "ms" ? "Memproses pembayaran..." : "Verifying payment..."}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "ms" ? "Sila tunggu sebentar" : "Please wait a moment"}
          </p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-medium text-foreground mb-4">
            {lang === "ms" ? "Pembayaran Tidak Disahkan" : "Payment Not Confirmed"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {lang === "ms"
              ? "Kami tidak dapat mengesahkan pembayaran anda. Sila hubungi sokongan jika wang telah ditolak."
              : "We couldn't confirm your payment. Please contact support if you were charged."}
          </p>
          <div className="space-y-3">
            <Link href="/artist">
              <Button className="w-full">
                {lang === "ms" ? "Lihat Tempahan Saya" : "View My Bookings"}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                {lang === "ms" ? "Kembali ke Halaman Utama" : "Return to Home"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-serif font-medium text-foreground mb-4">
          {lang === "ms" ? "Pembayaran Berjaya!" : "Booking Confirmed!"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {lang === "ms"
            ? "Tempahan anda telah disahkan. Anda akan menerima e-mel pengesahan tidak lama lagi."
            : "Your booking is confirmed. You'll receive a confirmation email shortly."}
        </p>
        <div className="space-y-3">
          <Link href="/artist">
            <Button className="w-full">
              {lang === "ms" ? "Lihat Tempahan Saya" : "View My Bookings"}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              {lang === "ms" ? "Kembali ke Halaman Utama" : "Return to Home"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
