'use client'

import Script from 'next/script'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getPostAuthRedirect, type UserRole } from '@/lib/routing'

declare const google: { accounts: { id: { initialize: (options: any) => void; prompt: (momentListener?: () => void) => void }; } }

async function routeUserAfterSignIn(userId: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) { window.location.href = "/"; return }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    window.location.href = "/sign-in/mfa"
    return
  }

  const { data: profile } = await supabase
    .from("profiles").select("role, created_at").eq("id", userId).maybeSingle()

  const role = (profile?.role as UserRole) || "customer"

  // New OneTap users get redirected to role picker instead of silently landing at /account
  const profileAge = profile?.created_at ? Date.now() - new Date(profile.created_at).getTime() : Infinity
  const isFreshProfile = profileAge < 5 * 60 * 1000
  if (role === "customer" && isFreshProfile) {
    window.location.href = "/auth/pick-role"
    return
  }

  const kind = role === "artist" ? "artist" : "studio"
  const { data: provider } = role === "customer" || role === "admin"
    ? { data: null }
    : await supabase.from("providers").select("id, slug").eq("owner_id", userId).eq("kind", kind).maybeSingle()

  window.location.href = getPostAuthRedirect(role, !!provider, (provider as { slug?: string } | null)?.slug)
}

const generateNonce = async (): Promise<string[]> => {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return [nonce, hashedNonce]
}

const GoogleOneTap = () => {
  const initializeGoogleOneTap = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session?.user) {
      await routeUserAfterSignIn(sessionData.session.user.id)
      return
    }

    if (!google?.accounts?.id) return

    const [nonce, hashedNonce] = await generateNonce()

    try {
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            })
            if (error) throw error
            if (data?.user) {
              await routeUserAfterSignIn(data.user.id)
            } else {
              window.location.href = "/account"
            }
          } catch (error) {
            console.error('Google One Tap sign-in failed:', error)
          }
        },
        cancel_on_tap_outside: true,
        params: {
          nonce: hashedNonce,
        },
      })
      google.accounts.id.prompt()
    } catch {
      // FedCM unavailable or user not signed into Google — silent fail
    }
  }

  return <Script onReady={() => { initializeGoogleOneTap() }} src="https://accounts.google.com/gsi/client" />
}

export default GoogleOneTap
