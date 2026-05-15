import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About | Leish!",
  description: "Malaysia's premier beauty marketplace connecting clients with top freelance makeup artists and studios.",
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        About Leish!
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Malaysia&apos;s Premier Beauty Marketplace</p>

      <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <p>
            Leish! connects clients with Malaysia&apos;s most talented freelance makeup artists and studios.
            Whether you&apos;re planning a wedding, preparing for a photoshoot, or need event glam,
            we make it easy to find and book the perfect artist for your needs.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">Our Mission</h2>
          <p>
            To democratize access to professional beauty services and empower makeup artists
            to build thriving businesses. We believe everyone deserves to feel beautiful,
            and every artist deserves a platform to showcase their craft.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">Our Team</h2>
          <p>
            Founded by Shamel Ali and Leiynda Rahman, Leish! is built by a passionate team
            dedicated to transforming the beauty industry in Malaysia and beyond.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">Contact</h2>
          <p>
            Email: <a href="mailto:hello@leish.my" className="text-accent hover:underline">hello@leish.my</a>
          </p>
          <p className="mt-1">
            DUTA INTEGRA SOLUTIONS (TR0325441-K)
          </p>
        </section>
      </div>
    </main>
  )
}
