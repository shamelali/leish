import { reportApiError } from "@/lib/ops/alerts"

const PHONE_CHUNKS = [
  /\b01\d[ -]?\d{7}\b/g,
  /\b01\d[ -]?\d{3}[ -]?\d{4}\b/g,
  /\b\+60[ -]?1\d[ -]?\d{3}[ -]?\d{4}\b/g,
]

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g

const SOCIAL_REGEX = /(?:instagram\.com|fb\.com|facebook\.com|t\.me|telegram|wa\.me|whatsapp\.com|tiktok\.com)[/\s][\w.-]+/gi

const WHATSAPP_REGEX = /(?:wa\.me|whatsapp\.com|api\.whatsapp\.com)\/send\?phone=\d+/gi

const USERNAME_REGEX = /@[A-Za-z0-9._-]{4,}/g

export interface ContactMatch {
  type: "phone" | "email" | "social" | "username" | "whatsapp"
  match: string
}

function detectPhones(content: string, matches: ContactMatch[]): void {
  for (const re of PHONE_CHUNKS) {
    const found = content.match(re)
    if (found) {
      for (const m of found) {
        matches.push({ type: "phone", match: m })
      }
    }
  }
}

function detectEmails(content: string, matches: ContactMatch[]): void {
  const found = content.match(EMAIL_REGEX)
  if (found) {
    for (const m of found) {
      matches.push({ type: "email", match: m })
    }
  }
}

function detectSocialLinks(content: string, matches: ContactMatch[]): void {
  const found = content.match(SOCIAL_REGEX)
  if (found) {
    for (const m of found) {
      matches.push({ type: "social", match: m })
    }
  }
}

function detectWhatsAppLinks(content: string, matches: ContactMatch[]): void {
  const found = content.match(WHATSAPP_REGEX)
  if (found) {
    for (const m of found) {
      matches.push({ type: "whatsapp", match: m })
    }
  }
}

function detectUsernames(content: string, matches: ContactMatch[]): void {
  const found = content.match(USERNAME_REGEX)
  if (found) {
    for (const m of found) {
      const existing = matches.some(
        (e) => e.type === "social" && e.match.toLowerCase().includes(m.slice(1).toLowerCase())
      )
      if (!existing) {
        matches.push({ type: "username", match: m })
      }
    }
  }
}

export function detectContactInfo(content: string): ContactMatch[] {
  const matches: ContactMatch[] = []
  detectPhones(content, matches)
  detectEmails(content, matches)
  detectSocialLinks(content, matches)
  detectWhatsAppLinks(content, matches)
  detectUsernames(content, matches)
  return matches
}

export function contentHasContactInfo(content: string): boolean {
  return detectContactInfo(content).length > 0
}

export type ContactFilterResult =
  | { allowed: true }
  | { allowed: false; reason: string; matches: ContactMatch[] }

export function checkMessageContent(content: string, userId: string): ContactFilterResult {
  const matches = detectContactInfo(content)
  if (matches.length === 0) {
    return { allowed: true }
  }

  const types = [...new Set(matches.map((m) => m.type))]
  const typeLabels: Record<string, string> = {
    phone: "phone number",
    email: "email address",
    social: "social media link",
    username: "username handle",
    whatsapp: "WhatsApp link",
  }
  const label = types.map((t) => typeLabels[t] || t).join(" and ")

  reportApiError("contact_filter_blocked", null, {
    userId,
    matches: JSON.stringify(matches),
  })

  return {
    allowed: false,
    reason: `Messages cannot contain ${label}. Please keep all communication on Leish.`,
    matches,
  }
}
