import { Metadata } from 'next'
import Link from 'next/link'
import { Check, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Upgrade to Pro | Leish!',
  description: 'Unlock professional tools for your makeup business. Get unlimited clients, automated reminders, and advanced analytics.',
}

const FREE_FEATURES = [
  { name: 'Basic profile with 5 portfolio images', included: true },
  { name: 'Manual calendar', included: true },
  { name: 'Up to 10 client contacts', included: true },
  { name: 'Internal chat (Leish-masked)', included: true },
  { name: 'Bank transfer / cash payments', included: true },
  { name: 'Basic analytics', included: true },
  { name: 'Smart scheduling with buffer times', included: false },
  { name: 'Unlimited client management', included: false },
  { name: 'Automated SMS/WhatsApp reminders', included: false },
  { name: 'Stripe/Billplz payment integration', included: false },
  { name: 'Client notes & preferences history', included: false },
  { name: 'Auto-follow-up sequences', included: false },
  { name: 'Revenue analytics & insights', included: false },
  { name: 'Custom profile URL (yourname.leish.my)', included: false },
  { name: 'Google Calendar sync', included: false },
  { name: 'Priority support', included: false },
]

const PRO_FEATURES = [
  ...FREE_FEATURES.filter(f => f.included),
  ...FREE_FEATURES.filter(f => !f.included).map(f => ({ ...f, included: true })),
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Pricing
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Upgrade Your Business
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Professional tools to grow your makeup business. 
            Start free, upgrade when you&#39;re ready.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="border border-border rounded-2xl p-8">
            <div className="text-center">
              <h3 className="font-serif text-2xl font-medium text-foreground">Starter</h3>
              <p className="mt-2 text-muted-foreground">For MUAs just starting out</p>
              <div className="mt-6">
                <span className="text-4xl font-serif font-medium text-foreground">RM0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            
            <ul className="mt-8 space-y-4">
              {FREE_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button asChild variant="outline" className="w-full">
                <Link href="/artist/onboarding">Get Started Free</Link>
              </Button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="relative border-2 border-accent rounded-2xl p-8 bg-accent/5">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            </div>
            
            <div className="text-center">
              <h3 className="font-serif text-2xl font-medium text-foreground">Pro</h3>
              <p className="mt-2 text-muted-foreground">For serious professionals</p>
              <div className="mt-6">
                <span className="text-4xl font-serif font-medium text-foreground">RM59</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-accent">
                Or RM399/year (save 2 months)
              </p>
            </div>
            
            <ul className="mt-8 space-y-4">
              {PRO_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-foreground">
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button asChild className="w-full">
                <Link href="/sign-in?upgrade=pro">Upgrade to Pro</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl font-medium text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-foreground">Can I cancel anytime?</h4>
              <p className="mt-2 text-muted-foreground text-sm">
                Yes, you can cancel your Pro subscription anytime. You&#39;ll keep premium features until your billing period ends.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground">Is there a free trial?</h4>
              <p className="mt-2 text-muted-foreground text-sm">
                New Pro users get a 14-day free trial. No credit card required to start.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground">What happens to my data if I downgrade?</h4>
              <p className="mt-2 text-muted-foreground text-sm">
                Your data is preserved. You can upgrade again anytime to access full features.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground">How do payments work?</h4>
              <p className="mt-2 text-muted-foreground text-sm">
                We accept credit/debit cards, online banking, and e-wallets via Stripe and Billplz.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Questions?{' '}
            <a href="mailto:hello@leish.my" className="text-accent hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
