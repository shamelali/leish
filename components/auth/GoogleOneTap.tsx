'use client'

import Script from 'next/script'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getPostAuthRedirect, type UserRole } from '@/lib/routing'

declare const google: { accounts: { id: { initialize: (options: any) => void; prompt: () => void }; } }

async function routeUserAfterSignIn(userId: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) { window.location.href = "/"; return }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    window.location.href = "/sign-in/mfa"
    return
  }

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", userId).maybeSingle()

  const role = (profile?.role as UserRole) || "customer"
  const kind = role === "artist" ? "artist" : "studio"
  const { data: provider } = role === "customer" || role === "admin"
    ? { data: null }
    : await supabase.from("providers").select("id").eq("owner_id", userId).eq("kind", kind).maybeSingle()

  window.location.href = getPostAuthRedirect(role, !!provider)
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
    const [nonce, hashedNonce] = await generateNonce()

    const supabase = getSupabaseBrowserClient()
    if (!supabase) { console.error('Supabase client not available'); return }

    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session?.user) {
      await routeUserAfterSignIn(sessionData.session.user.id)
      return
    }

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
          console.error('Error logging in with Google One Tap', error)
        }
      },
      nonce: hashedNonce,
      use_fedcm_for_prompt: true,
    })
    google.accounts.id.prompt()
  }

  return <Script onReady={() => { initializeGoogleOneTap().catch(console.error) }} src="https://accounts.google.com/gsi/client" />
}

export default GoogleOneTap
