'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@leish/shared/lib/auth/next-auth'

const GoogleOneTap = () => {
  const router = useRouter()

  useEffect(() => {
    const pendingRole = sessionStorage.getItem('pendingOAuthRole')
    const callbackUrl = pendingRole
      ? `${window.location.origin}/auth/callback?role=${encodeURIComponent(pendingRole)}`
      : window.location.href

    signIn('google', { callbackUrl })
  }, [router])

  return null
}

export default GoogleOneTap
