import type { Metadata } from 'next'
import { Outfit, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AiConcierge } from '@/components/ai-concierge'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/lib/i18n/language-context'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'
import { initErrorHandlers } from "@/lib/utils/error-handler"

const inter = Outfit({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Outfit({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const mono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Leish! | Your Beauty, Perfected',
  description: 'Discover and book elite freelance makeup artists for weddings, events, and editorial shoots. Luxury beauty services, curated for you.',
  openGraph: {
    title: 'Leish! | Your Beauty, Perfected',
    description: 'Discover and book elite freelance makeup artists for weddings, events, and editorial shoots. Luxury beauty services, curated for you.',
    type: 'website',
    url: 'https://www.leish.my',
    siteName: 'Leish!',
    locale: 'en_MY',
    images: [
      {
        url: 'https://www.leish.my/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Leish! - Malaysia\'s Premier Beauty Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leish! | Your Beauty, Perfected',
    description: 'Discover and book elite freelance makeup artists for weddings, events, and editorial shoots.',
    images: ['https://www.leish.my/images/og-image.jpg'],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/icon.svg',
  },
}

export const viewport = {
  themeColor: '#faf7f2',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <ErrorBoundary>
              <Navbar />
              <main>{children}</main>
              <Footer />
              <AiConcierge />
              <Analytics />
            </ErrorBoundary>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

// Initialize error handlers on client side
if (typeof window !== "undefined") {
  initErrorHandlers()
}
