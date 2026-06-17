async function sha1(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input)
  // SHA-1 is required by the Have I Been Pwned API (k-anonymity model)
  // eslint-disable-next-line sonarjs/hashing
  const hash = await crypto.subtle.digest("SHA-1", buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
}

export async function isPasswordPwned(password: string): Promise<number | null> {
  try {
    const hash = await sha1(password)
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
    if (!res.ok) return null
    const text = await res.text()
    for (const line of text.split("\n")) {
      const [hashSuffix, count] = line.split(":")
      if (hashSuffix === suffix) return parseInt(count, 10)
    }
    return 0
  } catch {
    return null
  }
}
