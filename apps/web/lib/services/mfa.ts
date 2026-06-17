import type { SupabaseClient } from "@supabase/supabase-js"

export type MFAFactor = {
  id: string
  type: "totp"
  createdAt: string
  verified: boolean
}

export type EnrollmentResult = {
  factorId: string
  qrCode: string
  secret: string
  uri: string
}

export type ChallengeResult = {
  challengeId: string
  expiresAt: number
}

const BACKUP_CODE_COUNT = 10
const BACKUP_CODE_LENGTH = 10

const ATTEMPT_WINDOW_MS = 300_000
const MAX_ATTEMPTS = 5
const USED_TOKEN_TTL_MS = 60_000

type RateLimitEntry = {
  count: number
  resetAt: number
}

const attemptBuckets = new Map<string, RateLimitEntry>()
const usedTokens = new Map<string, number>()

export class MFAService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async listFactors(): Promise<MFAFactor[]> {
    const { data, error } = await this.supabase.auth.mfa.listFactors()
    if (error) throw new Error(`Failed to list MFA factors: ${error.message}`)
    return data.all.map((f) => ({
      id: f.id,
      type: f.factor_type as "totp",
      createdAt: f.created_at,
      verified: f.status === "verified",
    }))
  }

  async hasVerifiedFactor(): Promise<boolean> {
    const factors = await this.listFactors()
    return factors.some((f) => f.verified)
  }

  async getAAL(): Promise<"aal1" | "aal2"> {
    const { data } = await this.supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    return (data?.currentLevel as "aal1" | "aal2") ?? "aal1"
  }

  async enroll(): Promise<EnrollmentResult> {
    const { data, error } = await this.supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "Leish!",
    })
    if (error) throw new Error(`Failed to enroll MFA: ${error.message}`)

    return {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    }
  }

  async challenge(factorId: string): Promise<ChallengeResult> {
    const { data, error } = await this.supabase.auth.mfa.challenge({
      factorId,
    })
    if (error) throw new Error(`Failed to create challenge: ${error.message}`)

    return {
      challengeId: data.id,
      expiresAt: data.expires_at,
    }
  }

  async verify(factorId: string, challengeId: string, code: string): Promise<void> {
    const { error } = await this.supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    })
    if (error) throw new Error(`MFA verification failed: ${error.message}`)
  }

  async unenroll(factorId: string): Promise<void> {
    const { error } = await this.supabase.auth.mfa.unenroll({
      factorId,
    })
    if (error) throw new Error(`Failed to unenroll MFA: ${error.message}`)
  }

  generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      const bytes = new Uint8Array(BACKUP_CODE_LENGTH)
      crypto.getRandomValues(bytes)
      const code = Array.from(bytes)
        .map((b) => b.toString(36).toUpperCase())
        .join("")
        .slice(0, 8)
      codes.push(code)
    }
    return codes
  }

  async verifyWithRateLimiting(
    userId: string,
    factorId: string,
    code: string
  ): Promise<boolean> {
    this.checkRateLimit(userId)

    const usedKey = `${userId}:${code}`
    const usedAt = usedTokens.get(usedKey)
    if (usedAt && Date.now() - usedAt < USED_TOKEN_TTL_MS) {
      throw new Error("This code has already been used. Wait for a new one.")
    }

    const { data: factors } = await this.supabase.auth.mfa.listFactors()
    if (!factors) throw new Error("Failed to list MFA factors")

    const factor = factors.all.find((f) => f.id === factorId)
    if (!factor) throw new Error("MFA factor not found")

    try {
      const challenge = await this.challenge(factorId)
      await this.verify(factorId, challenge.challengeId, code)

      attemptBuckets.delete(userId)
      usedTokens.set(usedKey, Date.now())
      setTimeout(() => usedTokens.delete(usedKey), USED_TOKEN_TTL_MS)

      return true
    } catch (err: unknown) {
      this.incrementAttempt(userId)
      throw err
    }
  }

  private checkRateLimit(userId: string): void {
    const entry = attemptBuckets.get(userId)
    if (!entry) return

    if (Date.now() >= entry.resetAt) {
      attemptBuckets.delete(userId)
      return
    }

    if (entry.count >= MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((entry.resetAt - Date.now()) / 1000)
      throw new Error(
        `Too many MFA attempts. Please wait ${retryAfterSec} seconds.`
      )
    }
  }

  private incrementAttempt(userId: string): void {
    const now = Date.now()
    const entry = attemptBuckets.get(userId)

    if (!entry || now >= entry.resetAt) {
      attemptBuckets.set(userId, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS })
      return
    }

    entry.count += 1
  }
}
