"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react"
import { PasswordValidator } from "@/lib/password-check"
import { routeUserAfterSignIn, routeUserAfterSignUp } from "@/components/auth/sign-in-helpers"
import { RoleSelectDialog } from "@/components/auth/role-select-dialog"
import { isPasswordPwned } from "@/lib/ops/password-check"
import type { UserRole } from "@/lib/routing"

export type { UserRole }

function getScoreLabel(score: number): string {
  switch (score) {
    case 0: return "Very Weak"
    case 1: return "Weak"
    case 2: return "Fair"
    case 3: return "Strong"
    case 4: return "Very Strong"
    default: return ""
  }
}

function getScoreColor(score: number): string {
  switch (score) {
    case 0: return "bg-red-500"
    case 1: return "bg-orange-500"
    case 2: return "bg-yellow-500"
    case 3: return "bg-lime-500"
    case 4: return "bg-green-500"
    default: return "bg-gray-200"
  }
}

const validator = new PasswordValidator({ checkBreached: false })

export function SupabaseAuthForm({ defaultMode = "signin", hideOAuth, hideToggle }: { defaultMode?: "signin" | "signup", hideOAuth?: boolean, hideToggle?: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(defaultMode === "signup")
  const [loading, setLoading] = useState(false)
  const [passwordResult, setPasswordResult] = useState<Awaited<ReturnType<typeof validator.validate>> | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [showRoleDialog, setShowRoleDialog] = useState(false)

  const [role, setRole] = useState<UserRole>("customer")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  const userInputs = useMemo(() => [email, fullName].filter(Boolean), [email, fullName])

  const handlePasswordChange = async (value: string) => {
    setPassword(value)
    if (value.length >= 3) {
      const result = await validator.validate(value, userInputs)
      setPasswordResult(result)
    } else {
      setPasswordResult(null)
    }
  }

  async function handleSignUp(supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>) {
    const result = await validator.validate(password, userInputs)
    setPasswordResult(result)

    if (!result.valid) {
      setMessage({ type: "error", text: result.errors.join(". ") })
      setLoading(false)
      return
    }

    const pwnedCount = await isPasswordPwned(password)
    if (pwnedCount !== null && pwnedCount > 0) {
      setMessage({
        type: "error",
        text: `This password has been exposed in ${pwnedCount.toLocaleString()} data breach(es). Please choose a different password.`,
      })
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
          phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) throw signUpError

    // Auto-confirm the user server-side to handle cases where
    // confirmation email lands in spam (DKIM/DMARC not yet set up)
    if (data.user?.id) {
      fetch("/api/auth/auto-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      }).catch(() => {})
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setMessage({
        type: "success",
        text: "Account created! Please sign in to continue.",
      })
      setIsSignUp(false)
      return
    }

    if (!signInData.user) {
      router.replace("/")
      return
    }

    router.replace(routeUserAfterSignUp(role))
  }

  async function checkCredentialStuffing() {
    const res = await fetch(`/api/auth/credential-stuffing?email=${encodeURIComponent(email)}`)
    if (!res.ok) return
    const check = await res.json()
    if (check.blocked) throw new Error(check.reason || "Login is temporarily blocked")
    if (check.delay) await new Promise((resolve) => setTimeout(resolve, check.delay))
  }

  function recordFailedAttempt() {
    fetch("/api/auth/credential-stuffing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "record", email }),
    }).catch(() => {})
  }

  function clearFailedAttempts() {
    fetch("/api/auth/credential-stuffing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear", email }),
    }).catch(() => {})
  }

  async function handleSignIn(supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>) {
    await checkCredentialStuffing()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      recordFailedAttempt()
      throw error
    }

    clearFailedAttempts()

    if (!data.user) {
      router.replace("/")
      return
    }

    const redirectUrl = await routeUserAfterSignIn(supabase, data.user.id)
    router.replace(redirectUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = getSupabaseBrowserClient()

    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      if (isSignUp) {
        await handleSignUp(supabase)
      } else {
        await handleSignIn(supabase)
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      setMessage({ type: "error", text: error.message || "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    // If a role was already selected on /auth/pick-role, use it directly
    const stored = document.cookie.split(";").find(c => c.trim().startsWith("pendingOAuthRole="))
    const storedRole = stored ? decodeURIComponent(stored.split("=")[1]) : null
    if (storedRole && ["artist", "studio", "customer"].includes(storedRole)) {
      handleGoogleRoleSelect(storedRole as UserRole)
      return
    }
    setShowRoleDialog(true)
  }

  const handleGoogleRoleSelect = async (selectedRole: UserRole) => {
    setShowRoleDialog(false)
    setLoading(true)
    setMessage(null)

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase client not initialized" })
      setLoading(false)
      return
    }

    sessionStorage.setItem("pendingOAuthRole", selectedRole)
    // Cookie survives cross-origin OAuth redirect (sessionStorage can be unreliable)
    // SameSite=None;Secure required for cross-site redirect from supabase.co back to leish.my
    document.cookie = `pendingOAuthRole=${encodeURIComponent(selectedRole)};path=/;max-age=600;samesite=none;secure`

    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    })

    if (error) {
      sessionStorage.removeItem("pendingOAuthRole")
      document.cookie = "pendingOAuthRole=;path=/;max-age=0;samesite=none;secure"
      setMessage({ type: "error", text: error.message || "Failed to sign in with Google" })
      setLoading(false)
    }
  }

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case "artist": return "Makeup Artist"
      case "studio": return "Studio Owner"
      case "customer": return "Customer"
      default: return r
    }
  }

  let buttonLabel: string;
  if (isSignUp) {
    if (defaultMode === "signup") {
      buttonLabel = "Register";
    } else if (role === "customer") {
      buttonLabel = "Create Account";
    } else {
      buttonLabel = `Sign Up as ${getRoleLabel(role)}`;
    }
  } else {
    buttonLabel = "Sign In";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSignUp && (
        <>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={isSignUp}
              placeholder="Your full name"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+60 123 456 789"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              I am a
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["customer", "artist", "studio"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-2 rounded-md border text-sm transition-colors ${
                    role === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {getRoleLabel(r)}
                </button>
              ))}
            </div>
            {role === "artist" && (
              <p className="mt-2 text-xs text-muted-foreground">
                As a makeup artist, you can list your services and accept bookings from customers.
              </p>
            )}
            {role === "studio" && (
              <p className="mt-2 text-xs text-muted-foreground">
                As a studio owner, you can manage your studio and artists.
              </p>
            )}
          </div>
        </>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
            className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {isSignUp && passwordResult && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i <= passwordResult.score ? getScoreColor(passwordResult.score) : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={passwordResult.score >= 3 ? "text-green-600" : "text-muted-foreground"}>
                {getScoreLabel(passwordResult.score)}
              </span>
              <span className="text-muted-foreground">
                Crack time: {passwordResult.crackTime}
              </span>
            </div>
            {passwordResult.warning && (
              <p className="text-xs text-orange-600">{passwordResult.warning}</p>
            )}
            {passwordResult.suggestions.length > 0 && (
              <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                {passwordResult.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!isSignUp && (
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        )}
        {!isSignUp && (
          <Link
            href="/forgot-password"
            className="mt-1 block text-xs text-accent hover:underline"
          >
            Forgot password?
          </Link>
        )}
      </div>

      {passwordResult?.isLeaked && (
        <div className="p-3 rounded-md text-sm bg-yellow-100 text-yellow-800 border border-yellow-300">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Password found in data breach</p>
              <p className="mt-1 text-xs">
                This password has appeared in a known data breach. Using it puts your account at risk.
              </p>
              <button
                type="button"
                onClick={() => {
                  validator.checkBreached = false
                  setPasswordResult((prev) => prev ? { ...prev, isLeaked: false, errors: [], valid: true } : null)
                }}
                className="mt-2 text-xs underline hover:no-underline"
              >
                I understand, create account anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Please wait...
          </span>
        ) : (
          buttonLabel
        )}
      </button>

      {!hideOAuth && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-foreground hover:bg-accent disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </>
      )}

      {!hideToggle && (
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setMessage(null)
            if (!isSignUp) {
              setRole("customer")
              setFullName("")
              setPhone("")
            }
          }}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"
          }
        </button>
      )}

      <RoleSelectDialog
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        onSelect={handleGoogleRoleSelect}
      />
    </form>
  )
}

export const SupabaseAuth = SupabaseAuthForm
