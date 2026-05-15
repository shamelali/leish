import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Leish!",
  description: "Terms of Service for Leish! beauty marketplace platform.",
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

      <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">1. Introduction</h2>
          <p>
            Welcome to Leish! (&quot;we,&quot; &quot;our,&quot; &quot;us&quot;). By using our platform at leish.my,
            you agree to these Terms of Service. If you do not agree, please do not use our services.
          </p>
          <p className="mt-2">
            Leish! is operated by <strong>DUTA INTEGRA SOLUTIONS (TR0325441-K)</strong>,
            a registered entity in Malaysia.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">2. Definitions</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Platform</strong> — the Leish! website and mobile services.</li>
            <li><strong>Client</strong> — a user seeking to book makeup or beauty services.</li>
            <li><strong>Provider</strong> — a makeup artist or studio offering services through the platform.</li>
            <li><strong>Services</strong> — beauty, makeup, and related services booked through the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">3. User Accounts</h2>
          <p>
            You must register for an account to use certain features. You are responsible for
            maintaining the confidentiality of your login credentials and for all activities
            under your account.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">4. Bookings & Payments</h2>
          <p>
            All bookings are subject to availability. Payments are processed through our
            third-party payment gateway, Billplz. Commission rates are disclosed at the
            time of booking and may vary based on provider tier.
          </p>
          <p className="mt-2">
            Cancellation policies are set by individual providers. Refunds are handled
            in accordance with our refund policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">5. Provider Obligations</h2>
          <p>
            Providers agree to deliver services as described in their profile. Failure to
            do so may result in suspension or removal from the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">6. Limitation of Liability</h2>
          <p>
            Leish! acts as a marketplace connecting clients and providers. We are not
            responsible for the quality of services provided by third-party artists and
            studios. Our liability is limited to the maximum extent permitted by Malaysian law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">7. Governing Law</h2>
          <p>
            These terms are governed by the laws of Malaysia. Any disputes shall be
            resolved in the courts of Malaysia.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">8. Contact</h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a href="mailto:legal@leish.my" className="text-accent hover:underline">
              legal@leish.my
            </a>.
          </p>
        </section>
      </div>
    </main>
  )
}
