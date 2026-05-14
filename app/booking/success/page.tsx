"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/language-context"

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const { lang } = useTranslation()

  useEffect(() => {
    // Simulate checking payment status
    const timer = setTimeout(() => {
      setStatus("success")
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {lang === "ms" ? "Memproses pembayaran..." : "Processing payment..."}
          </h1>
          <p className="text-gray-600">
            {lang === "ms" ? "Sila tunggu sebentar" : "Please wait a moment"}
          </p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === "ms" ? "Pembayaran Gagal" : "Payment Failed"}
          </h1>
          <p className="text-gray-600 mb-6">
            {lang === "ms" ? "Ada masalah dengan pembayaran anda. Sila cuba lagi." : "There was an issue with your payment. Please try again."}
          </p>
          <Link href="/">
            <Button>
              {lang === "ms" ? "Kembali ke Halaman Utama" : "Return to Home"}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center max-w-md mx-auto p-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {lang === "ms" ? "Pembayaran Berjaya!" : "Payment Successful!"}
        </h1>
        <p className="text-gray-600 mb-6">
          {lang === "ms" ? "Tempahan anda telah disahkan. Anda akan menerima e-mel pengesahan tidak lama lagi." : "Your booking has been confirmed. You'll receive a confirmation email shortly."}
        </p>
        <div className="space-y-3">
          <Link href="/booking">
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