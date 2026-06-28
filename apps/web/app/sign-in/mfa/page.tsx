"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MFAChallenge } from "@/components/mfa-challenge"
import { ShieldCheck } from "lucide-react"

export default function MfaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    if (!session) {
      router.replace("/sign-in")
      return
    }

    const user = session.user as any
    if (!user?.mfaEnabled || user?.mfaVerified) {
      router.replace("/account")
    }
  }, [session, router])

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-md px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-foreground">
            Two-Factor Authentication
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <MFAChallenge />
      </div>
    </section>
  )
}
