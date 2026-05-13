"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowRight, Check, Loader2, Upload, X } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const STATES = [
  "Wilayah Persekutuan Kuala Lumpur",
  "Selangor",
  "Pulau Pinang",
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Sabah",
  "Sarawak",
  "Terengganu",
  "Wilayah Persekutuan Labuan",
  "Wilayah Persekutuan Putrajaya",
]

interface FormData {
  displayName: string
  state: string
  district: string
  serviceName: string
  servicePrice: string
  serviceDuration: string
}

const STEPS = [
  { label: "About You", number: 1 },
  { label: "Your Service", number: 2 },
]

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
}

export function ArtistOnboardingQuick({
  userId,
  initialName,
}: {
  userId: string
  initialName: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    displayName: initialName,
    state: "",
    district: "",
    serviceName: "",
    servicePrice: "",
    serviceDuration: "60",
  })

  const update = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }))

  // Validation
  const step1Valid =
    form.displayName.trim().length >= 2 &&
    form.state.trim().length > 0 &&
    form.district.trim().length > 0

  const step2Valid =
    form.serviceName.trim().length >= 2 &&
    Number(form.servicePrice) > 0

  // Photo handling
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Photo must be less than 5MB")
        return
      }
      setProfilePhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setProfilePhoto(null)
    setPhotoPreview(null)
  }

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const baseSlug = slugify(form.displayName)
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

    try {
      // First, upload photo if exists
      let photoUrl = null
      if (profilePhoto) {
        const supabase = getSupabaseBrowserClient()
        if (supabase) {
          const fileExt = profilePhoto.name.split('.').pop()
          const fileName = `${userId}/${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('provider-assets')
            .upload(fileName, profilePhoto)
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('provider-assets')
              .getPublicUrl(fileName)
            photoUrl = publicUrl
          }
        }
      }

      // Create provider
      const res = await fetch("/api/onboarding/artist-quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          slug,
          displayName: form.displayName.trim(),
          state: form.state,
          district: form.district.trim(),
          service: {
            name: form.serviceName.trim(),
            priceMyr: Number(form.servicePrice),
            durationMinutes: Number(form.serviceDuration),
          },
          profilePhoto: photoUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create profile")

      router.replace("/pro?onboarded=1")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Artist Setup
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Build your profile
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete 2 quick steps to start receiving bookings
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-0">
        {STEPS.map((s, idx) => (
          <div key={s.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                  step > s.number
                    ? "border-accent bg-accent text-accent-foreground"
                    : step === s.number
                    ? "border-foreground bg-foreground text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {step > s.number ? <Check className="h-4 w-4" /> : s.number}
              </div>
              <span
                className={`mt-1 hidden text-[10px] uppercase tracking-widest sm:block ${
                  step === s.number ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-2 h-px w-16 transition-colors ${
                  step > s.number ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="border border-border bg-card p-6 sm:p-8">
        {/* Step 1: About You */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-medium text-foreground">About you</h2>
            
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Display name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => update({ displayName: e.target.value })}
                placeholder="e.g. Aisyah Razak"
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This is how clients will find you on Leish
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  State <span className="text-accent">*</span>
                </label>
                <select
                  value={form.state}
                  onChange={(e) => update({ state: e.target.value })}
                  className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Area / District <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => update({ district: e.target.value })}
                  placeholder="e.g. Petaling Jaya"
                  className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Profile photo <span className="text-muted-foreground">(optional)</span>
              </label>
              <div className="mt-2">
                {photoPreview ? (
                  <div className="relative inline-block">
                    <Image
                      src={photoPreview}
                      alt="Profile preview"
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-full object-cover"
                      unoptimized
                    />
                    <button
                      onClick={removePhoto}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-border bg-background hover:border-accent">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-1 text-[10px] text-muted-foreground">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                You can add more photos later in your dashboard
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Service */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-medium text-foreground">
              Your first service
            </h2>
            <p className="text-sm text-muted-foreground">
              Add at least one service. You can add more later from your dashboard.
            </p>

            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Service name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                value={form.serviceName}
                onChange={(e) => update({ serviceName: e.target.value })}
                placeholder="e.g. Bridal Makeup, Event Glam"
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Price (MYR) <span className="text-accent">*</span>
                </label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    RM
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={form.servicePrice}
                    onChange={(e) => update({ servicePrice: e.target.value })}
                    placeholder="299"
                    className="w-full border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Duration
                </label>
                <select
                  value={form.serviceDuration}
                  onChange={(e) => update({ serviceDuration: e.target.value })}
                  className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>
            </div>

            <div className="rounded bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What happens next?</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Your profile goes live immediately</li>
                <li>Clients can start booking you right away</li>
                <li>You can add more services and photos anytime</li>
                <li>Upgrade to Pro for more features</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          ← Back
        </button>

        {step === 1 ? (
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className="flex items-center gap-2 border border-foreground bg-foreground px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:border-accent disabled:pointer-events-none disabled:opacity-30"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!step2Valid || submitting}
            className="flex items-center gap-2 border border-accent bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating profile...
              </>
            ) : (
              <>
                Go Live
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Skip option */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Need help? Contact us at support@leish.my
      </p>
    </div>
  )
}
