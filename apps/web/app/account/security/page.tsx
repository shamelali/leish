export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { MFAEnroll } from "@/components/mfa-enroll"
import { MFAStatus } from "@/components/mfa-status"
import { ChangePassword } from "@/components/change-password"

export const metadata: Metadata = {
  title: "Security | Leish!",
  description: "Manage your account security settings.",
}

export default function SecurityPage() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        <div className="mb-10 border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Account
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Security
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your account security and authentication settings.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="font-serif text-xl font-medium text-foreground">
              Two-Factor Authentication
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an extra layer of security by requiring a verification code
              from your authenticator app when signing in.
            </p>
            <div className="mt-4">
              <MFAStatus />
            </div>
            <div className="mt-4">
              <MFAEnroll />
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="font-serif text-xl font-medium text-foreground">
              Password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Change your account password. All existing sessions will be
              invalidated and you will need to sign in again.
            </p>
            <div className="mt-4">
              <ChangePassword />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
