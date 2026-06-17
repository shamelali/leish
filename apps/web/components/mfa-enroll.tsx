"use client"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { MFAService, type EnrollmentResult } from "@/lib/services/mfa"
import { TokenRevocationService } from "@/lib/services/token-revocation"
import { Loader2, Shield, ShieldCheck, Copy, Check } from "lucide-react"

export function MFAEnroll() {
  const [step, setStep] = useState<"idle" | "enrolling" | "qr" | "verify" | "done" | "error">("idle")
  const [enrollment, setEnrollment] = useState<EnrollmentResult | null>(null)
  const [verifyCode, setVerifyCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const handleEnroll = async () => {
    setLoading(true)
    setError("")

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Supabase client not initialized")
      setLoading(false)
      return
    }

    try {
      const mfa = new MFAService(supabase)
      const result = await mfa.enroll()
      setEnrollment(result)
      setStep("qr")
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || "Failed to enroll MFA")
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!enrollment) return
    setLoading(true)
    setError("")

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Supabase client not initialized")
      setLoading(false)
      return
    }

    try {
      const mfa = new MFAService(supabase)
      const challenge = await mfa.challenge(enrollment.factorId)
      await mfa.verify(enrollment.factorId, challenge.challengeId, verifyCode)
      const codes = mfa.generateBackupCodes()
      setBackupCodes(codes)

      // Invalidate all sessions — user must sign in with MFA enabled
      const tokenService = new TokenRevocationService()
      await tokenService.signOutCurrentSession()

      setStep("done")
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || "Verification failed. Check the code and try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === "idle") {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-medium text-foreground">
              Two-Factor Authentication
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an extra layer of security to your account. You will need to enter a code
              from your authenticator app when signing in.
            </p>
            <button
              onClick={handleEnroll}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Set up Two-Factor Authentication
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === "enrolling") {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Setting up two-factor authentication...</p>
      </div>
    )
  }

  if (step === "qr" && enrollment) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-medium text-foreground">
              Scan QR Code
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy).
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrollment.qrCode}
            alt="MFA QR Code"
            className="h-48 w-48 rounded-lg border border-border"
          />
        </div>

        <div className="mt-4 rounded-md bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Or enter this code manually:
          </p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 rounded bg-background px-2 py-1 text-sm font-mono">
              {enrollment.secret}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(enrollment.secret)}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              title="Copy secret"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-foreground">
            Verify the code from your app
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="block w-40 rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest"
            />
            <button
              onClick={handleVerify}
              disabled={loading || verifyCode.length < 6}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Verify
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    )
  }

  if (step === "done") {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-green-500/10 p-3">
            <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-medium text-foreground">
              Two-Factor Authentication Enabled
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account is now protected with two-factor authentication.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-md bg-yellow-500/10 border border-yellow-500/20 p-4">
          <p className="text-sm font-medium text-yellow-800">
            Save your backup codes
          </p>
          <p className="mt-1 text-xs text-yellow-700">
            If you lose access to your authenticator app, you can use these
            one-time backup codes to sign in. Each code can only be used once.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1">
            {backupCodes.map((code, i) => (
              <code key={i} className="rounded bg-background px-2 py-1 text-xs font-mono">
                {code}
              </code>
            ))}
          </div>
          <button
            onClick={copyBackupCodes}
            className="mt-3 inline-flex items-center gap-1 text-xs text-yellow-800 underline hover:no-underline"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied!" : "Copy backup codes"}
          </button>
        </div>

        <p className="mt-4 text-sm text-yellow-800">
          Your session has been invalidated for security. You will be redirected
          to sign in with your new MFA configuration.
        </p>

        <button
          onClick={() => { window.location.href = "/sign-in" }}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign In Now
        </button>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-destructive/10 p-3">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-medium text-foreground">
              Setup Failed
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => {
                setStep("idle")
                setError("")
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
