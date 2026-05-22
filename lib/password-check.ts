"use client"

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

  return text.split("\r\n").some((line) => line.startsWith(suffix))
}
