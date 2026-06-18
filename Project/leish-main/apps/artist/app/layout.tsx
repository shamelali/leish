import type { Metadata } from "next"
import { LanguageProvider } from "@leish/shared/lib/i18n/context"
import { CloudflareAnalytics } from "@leish/shared/lib/analytics/cloudflare-analytics"
import { Toaster } from "sonner"
import "../styles/globals.css"

export const metadata: Metadata = {
  title: "Leish Artist",
  description: "Artist booking portal",
}

export default function ArtistRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <LanguageProvider>
          {children}
          <Toaster />
          <CloudflareAnalytics />
        </LanguageProvider>
      </body>
    </html>
  )
}
