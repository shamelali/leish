'use client'

import { useRouter } from 'next/navigation'
import Script from 'next/script'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

declare const google: { accounts: { id: { initialize: (options: any) => void; prompt: () => void }; } }

// generate nonce to use for google id token sign-in
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
  const router = useRouter()

  const initializeGoogleOneTap = async () => {
    console.log('Initializing Google One Tap')
    const [nonce, hashedNonce] = await generateNonce()
    console.log('Nonce: ', nonce, hashedNonce)

    // check if there's already an existing session before initializing the one-tap UI
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    const { data, error } = await supabase.auth.getClaims()
    if (error) {
      console.error('Error getting claims', error)
    }
    if (data) {
      router.push('/')
      return
    }

    /* global google */
    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          // send id token returned in response.credential to supabase
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce,
          })

          if (error) throw error
          console.log('Session data: ', data)
          console.log('Successfully logged in with Google One Tap')

          // redirect to protected page
          router.push('/')
        } catch (error) {
          console.error('Error logging in with Google One Tap', error)
        }
      },
      nonce: hashedNonce,
      // with chrome's removal of third-party cookies, we need to use FedCM instead (https://developers.google.com/identity/gsi/web/guides/fedcm-migration)
      use_fedcm_for_prompt: true,
    })
    google.accounts.id.prompt() // Display the One Tap UI
  }

  return <Script onReady={() => { initializeGoogleOneTap().catch(console.error) }} src="https://accounts.google.com/gsi/client" />
}

export default GoogleOneTap