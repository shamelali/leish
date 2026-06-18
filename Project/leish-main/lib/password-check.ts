import zxcvbn from "zxcvbn"

export type PasswordResult = {
  valid: boolean
  errors: string[]
  score: number
  crackTime: string
  suggestions: string[]
  warning: string
  isLeaked: boolean
}

export class PasswordValidator {
  minLength: number
  minScore: number
  checkBreached: boolean

  constructor(options: { minLength?: number; minScore?: number; checkBreached?: boolean } = {}) {
    this.minLength = options.minLength ?? 8
    this.minScore = options.minScore ?? 3
    this.checkBreached = options.checkBreached !== false
  }

  async validate(password: string, userInputs: string[] = []): Promise<PasswordResult> {
    const errors: string[] = []
    let isLeaked = false
    let suggestions: string[] = []
    let warning = ""

    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters`)
    }

    const result = zxcvbn(password, userInputs)
    suggestions = result.feedback.suggestions ?? []
    warning = result.feedback.warning ?? ""

    if (result.score < this.minScore) {
      errors.push(warning || "Try a longer password with more variety")
      errors.push(...suggestions)
    }

    if (this.checkBreached && errors.length === 0) {
      isLeaked = await isPasswordLeaked(password)
      if (isLeaked) {
        errors.push("This password has been exposed in a data breach. Please choose a different password.")
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      score: result.score,
      crackTime: String(result.crack_times_display.offline_slow_hashing_1e4_per_second),
      suggestions,
      warning,
      isLeaked,
    }
  }
}

export async function isPasswordLeaked(password: string): Promise<boolean> {
  const msgBuffer = new TextEncoder().encode(password)
  // eslint-disable-next-line sonarjs/hashing -- SHA-1 is required by HIBP's k-anonymity API
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()

  const prefix = hashHex.slice(0, 5)
  const suffix = hashHex.slice(5)

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
  const text = await res.text()

  return text.split("\n").some((line) => {
    const [hashSuffix] = line.split(":")
    return hashSuffix?.trim() === suffix
  })
}
