"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck, Copy, Check } from "lucide-react"

export function MFAEnroll() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<"intro" | "qr" | "verify" | "done">("intro")
  const [secret, setSecret] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [verifyCodeInput, setVerifyCodeInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleEnroll = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/mfa/enroll", { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to set up MFA")
      }
      const data = await res.json()
      setSecret(data.secret)
      setQrCode(data.qrCode)
      setStep("qr")
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCodeInput }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Verification failed")
      }
      setStep("done")
      await update()
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if ((session?.user as any)?.mfaEnabled) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <span className="font-medium">Two-factor authentication is active</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {step === "intro" && (
        <div>
          <h3 className="text-lg font-medium">Set up Two-Factor Authentication</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use an authenticator app like Google Authenticator or Authy to scan the QR code.
          </p>
          <button
            onClick={handleEnroll}
            disabled={loading}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Set up"}
          </button>
        </div>
      )}

      {step === "qr" && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Scan QR Code</h3>
          <div className="flex justify-center">
            <img src={qrCode} alt="MFA QR Code" className="h-48 w-48" />
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">Or enter this key manually:</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-2 py-1 text-xs font-mono">{secret}</code>
              <button
                onClick={copySecret}
                className="rounded p-1 hover:bg-accent"
                title="Copy secret"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            After scanning, enter the 6-digit code from your authenticator app to verify.
          </p>
          <div>
            <label htmlFor="verify-code" className="block text-sm font-medium">
              Verification Code
            </label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCodeInput}
              onChange={(e) => setVerifyCodeInput(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-center text-xl tracking-widest font-mono"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={loading || verifyCodeInput.length < 6}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Enable"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-medium">Two-factor authentication is now enabled!</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">{error}</div>
      )}
    </div>
  )
}
