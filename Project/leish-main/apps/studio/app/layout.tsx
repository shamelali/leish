import type { Metadata } from "next"
import { Outfit, Space_Mono } from "next/font/google"
import { LanguageProvider } from "@leish/shared/lib/i18n/context"
import { CloudflareAnalytics } from "@leish/shared/lib/analytics/cloudflare-analytics"
import { Toaster } from "sonner"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import "../styles/globals.css"

const inter = Outfit({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Outfit({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const mono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Leish Studio",
  description: "Studio booking portal",
}

export const viewport = {
  themeColor: "#faf7f2",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${mono.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <LanguageProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <Toaster />
          <CloudflareAnalytics />
        </LanguageProvider>
      </body>
    </html>
  )
}
