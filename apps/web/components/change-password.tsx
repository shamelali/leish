"use client"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { PasswordValidator } from "@/lib/password-check"
import { TokenRevocationService } from "@/lib/services/token-revocation"
import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react"

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters" })
      setLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase client not initialized" })
      setLoading(false)
      return
    }

    try {
      // Verify current password by attempting sign in
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user?.email) {
        setMessage({ type: "error", text: "Unable to verify your identity. Please sign in again." })
        setLoading(false)
        return
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      })

      if (verifyError) {
        setMessage({ type: "error", text: "Current password is incorrect" })
        setLoading(false)
        return
      }

      // Validate new password strength
      const validator = new PasswordValidator({ checkBreached: false })
      const result = await validator.validate(newPassword, [userData.user.email])
      if (!result.valid) {
        setMessage({ type: "error", text: result.errors[0] })
        setLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      // Invalidate all sessions — user must sign in with new password
      const tokenService = new TokenRevocationService()
      await tokenService.signOutCurrentSession()

      setMessage({
        type: "success",
        text: "Password changed successfully. You will be redirected to sign in.",
      })

      setTimeout(() => {
        window.location.href = "/sign-in"
      }, 2000)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setMessage({ type: "error", text: e.message || "Failed to change password" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg font-medium text-foreground">
            Change Password
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your password. All existing sessions will be invalidated and
            you will need to sign in again.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-foreground">
            Current Password
          </label>
          <input
            id="current-password"
            type={showPasswords ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-foreground">
            New Password
          </label>
          <input
            id="new-password"
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="rounded border-border"
          />
          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          Show passwords
        </label>
      </div>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Changing password...
          </span>
        ) : (
          "Change Password"
        )}
      </button>
    </form>
  )
}
