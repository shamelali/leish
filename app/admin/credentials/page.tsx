import { redirect } from "next/navigation"
import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { getEnv } from "@/lib/env"

function CheckIcon({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <svg
        className="h-5 w-5 text-emerald-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }
  return (
    <svg
      className="h-5 w-5 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function CredentialRow({
  name,
  configured,
  description,
}: {
  name: string
  configured: boolean
  description: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div>
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-mono ${
            configured ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {configured ? "Configured" : "Missing"}
        </span>
        <CheckIcon configured={configured} />
      </div>
    </div>
  )
}

export default async function AdminCredentialsPage() {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return redirect("/sign-in")
  }

  const { data: profile } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profile.user?.id)
    .single()

  if (!userProfile?.role || !["admin", "studio_manager"].includes(userProfile.role)) {
    return redirect("/")
  }

  const env = getEnv()

  const NAV = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/credentials", label: "Credentials", active: true },
    { href: "/admin/providers", label: "Providers" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/moderation", label: "Moderation" },
  ]

  const credentials = [
    {
      name: "Supabase",
      configured: !!(
        env.NEXT_PUBLIC_SUPABASE_URL &&
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
      description: "Database and authentication",
    },
    {
      name: "Billplz API",
      configured: !!process.env.BILLPLZ_API_KEY,
      description: "Payment gateway (API key)",
    },
    {
      name: "Billplz X-Signature",
      configured: !!process.env.BILLPLZ_X_SIGNATURE,
      description: "Webhook verification",
    },
    {
      name: "Billplz Collection ID",
      configured: !!(
        process.env.BILLPLZ_COLLECTION_ID ||
        process.env.BILLPLZ_COLLECTION_ID_DEPOSIT
      ),
      description: "Payment collection ID",
    },
    {
      name: "Billplz Callback URL",
      configured: !!process.env.BILLPLZ_CALLBACK_URL,
      description: "Webhook callback URL",
    },
    {
      name: "WhatsApp API",
      configured: !!(
        process.env.WHATSAPP_PHONE_NUMBER_ID &&
        process.env.WHATSAPP_ACCESS_TOKEN
      ),
      description: "WhatsApp notifications",
    },
    {
      name: "Email (Resend)",
      configured: !!process.env.RESEND_API_KEY,
      description: "Email delivery service",
    },
    {
      name: "Email (Brevo)",
      configured: !!process.env.BREVO_API_KEY,
      description: "Alternative email service",
    },
    {
      name: "External Studio API",
      configured: !!(
        env.EXTERNAL_STUDIO_API_BASE_URL && env.EXTERNAL_STUDIO_API_KEY
      ),
      description: "Third-party studio integration",
    },
    {
      name: "External Studio API Key",
      configured: !!env.EXTERNAL_STUDIO_API_KEY,
      description: "API key for external studios",
    },
  ]

  const configuredCount = credentials.filter((c) => c.configured).length
  const totalCount = credentials.length

  return (
    <DashboardShell
      title="Credentials"
      subtitle="View configured API credentials and integrations."
      nav={NAV}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded border border-border bg-card px-4 py-3">
          <p className="text-2xl font-bold text-foreground">
            {configuredCount}/{totalCount}
          </p>
          <p className="text-xs text-muted-foreground">Configured</p>
        </div>
        <div
          className={`rounded px-3 py-1 text-xs font-medium ${
            configuredCount === totalCount
              ? "bg-emerald-50 text-emerald-600"
              : "bg-yellow-50 text-yellow-600"
          }`}
        >
          {configuredCount === totalCount
            ? "All systems configured"
            : "Some credentials missing"}
        </div>
      </div>

      <Panel title="Environment Credentials">
        <div className="divide-y divide-border">
          {credentials.map((cred) => (
            <CredentialRow key={cred.name} {...cred} />
          ))}
        </div>
      </Panel>

      <Panel title="Security Notice" className="mt-6">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-foreground">
              Credentials are not displayed for security reasons
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Only the configuration status is shown. Actual credentials are
              stored in environment variables and should be managed through your
              deployment platform or .env.local file.
            </p>
          </div>
        </div>
      </Panel>
    </DashboardShell>
  )
}