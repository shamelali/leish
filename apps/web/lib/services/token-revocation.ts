import { createClient } from "@supabase/supabase-js"

export class TokenRevocationService {
  private serviceClient: ReturnType<typeof createClient> | null = null

  private getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null

    if (!this.serviceClient) {
      this.serviceClient = createClient(url, key, {
        auth: { persistSession: false },
      })
    }
    return this.serviceClient
  }

  /** Invalidate all sessions for a user by banning briefly then unbanning */
  async invalidateAllSessions(userId: string): Promise<void> {
    const admin = this.getAdminClient()
    if (!admin) throw new Error("Service role key not configured")

    // Ban for 1 second to invalidate all sessions, then unban
    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "1s",
    })
    if (banError) throw new Error(`Failed to invalidate sessions: ${banError.message}`)

    // Unban immediately after
    const { error: unbanError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    })
    if (unbanError) throw new Error(`Failed to unban user: ${unbanError.message}`)
  }

  /** Sign out the current session (used client-side after password change) */
  async signOutCurrentSession(): Promise<void> {
    // This is called client-side — the browser client handles this
    const { createBrowserClient } = await import("@supabase/ssr")
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error("Supabase not configured")

    const client = createBrowserClient(url, key)
    const { error } = await client.auth.signOut()
    if (error) throw new Error(`Failed to sign out: ${error.message}`)
  }
}
