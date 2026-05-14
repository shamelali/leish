"use client"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export type UserRole = "admin" | "artist" | "studio_manager" | "customer"

function getPostSignInPath(role: UserRole | undefined): string {
  switch (role) {
    case "admin":
      return "/admin"
case "artist":
      return "/artist"
    case "studio_manager":
      return "/studios/dashboard"
    case "customer":
    default:
      return "/"
  }
}

export function SupabaseAuthForm({ defaultSignUp }: { defaultSignUp?: boolean }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(defaultSignUp ?? false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  // Sign up specific fields
  const [role, setRole] = useState<UserRole>("customer")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

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
        // Sign up with role selection and pass metadata for the signup trigger
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: fullName,
              phone,
            },
          },
        })
        
        if (error) throw error

        setMessage({ 
          type: "success", 
          text: role === "customer" 
            ? "Account created! You can now sign in."
            : "Account created! Please complete your profile to start accepting bookings." 
        })
        setIsSignUp(false)
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // Get user role and redirect accordingly
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single()

          const userRole = profile?.role as UserRole | undefined
          
          window.location.href = getPostSignInPath(userRole)
        } else {
          window.location.href = "/"
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      setMessage({ type: "error", text: error.message || "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setMessage(null)

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase client not initialized" })
      setLoading(false)
      return
    }

    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    })

    if (error) {
      setMessage({ type: "error", text: error.message || "Failed to sign in with Google" })
      setLoading(false)
    }
  }

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case "artist": return "Makeup Artist"
      case "studio_manager": return "Studio Owner"
      case "customer": return "Customer"
      default: return r
    }
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
              className="mt-1 block w-full min-h-11 rounded-md border border-input bg-background px-3 py-2"
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
              className="mt-1 block w-full min-h-11 rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              I am a
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["customer", "artist", "studio_manager"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`min-h-11 p-2.5 rounded-md border text-sm transition-colors ${
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
            {role === "studio_manager" && (
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="mt-1 block w-full min-h-11 rounded-md border border-input bg-background px-3 py-2"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="••••••••"
            className="block w-full min-h-11 rounded-md border border-input bg-background px-3 py-2 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Must be at least 6 characters
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Please wait...
          </span>
        ) : isSignUp ? (
          role === "customer" ? "Create Account" : `Sign Up as ${getRoleLabel(role)}`
        ) : (
          "Sign In"
        )}
      </button>

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
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-3 text-foreground hover:bg-accent disabled:opacity-50"
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
    </form>
  )
}

export const SupabaseAuth = SupabaseAuthForm
