'use client'

import Script from 'next/script'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

declare const google: { accounts: { id: { initialize: (options: any) => void; prompt: () => void }; } }

type UserRole = "admin" | "artist" | "studio" | "customer"

function getPostSignInPath(role: UserRole | undefined): string {
  switch (role) {
    case "admin":  return "/admin"
    case "artist": return "/artist"
    case "studio": return "/studios/dashboard"
    case "customer":
    default:       return "/account"
  }
}

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

  const userRole = profile?.role as UserRole | undefined

  if (userRole === "studio") {
    const { data: studio } = await supabase
      .from("providers").select("id").eq("owner_id", userId).eq("kind", "studio").maybeSingle()
    window.location.href = studio ? "/studios/dashboard" : "/studios/onboarding"
  } else if (userRole === "artist") {
    const { data: provider } = await supabase
      .from("providers").select("id").eq("owner_id", userId).eq("kind", "artist").maybeSingle()
    window.location.href = provider ? "/artist" : "/artist/onboarding"
  } else {
    window.location.href = getPostSignInPath(userRole)
  }
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
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

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