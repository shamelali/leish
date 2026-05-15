import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Leish!",
  description: "Privacy Policy for Leish! beauty marketplace platform.",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

      <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">1. Information We Collect</h2>
          <p>
            We collect information you provide when creating an account, making a booking,
            or contacting us. This includes your name, email address, phone number,
            and payment information.
          </p>
          <p className="mt-2">
            We also automatically collect technical data such as IP address, browser type,
            and usage patterns to improve our platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">2. How We Use Your Information</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>To facilitate bookings and payments</li>
            <li>To communicate about your account and bookings</li>
            <li>To improve our platform and user experience</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">3. Data Sharing</h2>
          <p>
            We share information with providers only as necessary to fulfill bookings.
            We use third-party services (Billplz for payments, Brevo for email,
            Supabase for hosting) that may process your data under their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">4. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to
            provide services. You may request deletion of your data by contacting us.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">5. Your Rights</h2>
          <p>
            Under the Personal Data Protection Act 2010 (Malaysia), you have the right to
            access, correct, or delete your personal data. Contact us to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-foreground">6. Contact</h2>
          <p>
            For privacy-related inquiries, contact us at{" "}
            <a href="mailto:legal@leish.my" className="text-accent hover:underline">
              legal@leish.my
            </a>.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            DUTA INTEGRA SOLUTIONS (TR0325441-K)
          </p>
        </section>
      </div>
    </main>
  )
}
