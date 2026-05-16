import { redirect } from "next/navigation";
import { getSupabaseSsrClient } from "@/lib/supabase/ssr";
import { StudioOnboardingWizard } from "@/components/studio-onboarding-wizard";

export const metadata = {
  title: "Set Up Your Studio | Leish!",
  description: "Complete your studio profile to start receiving bookings.",
};

export default async function StudioOnboardingPage() {
  const supabase = await getSupabaseSsrClient();

  if (!supabase) {
    return redirect("/sign-in");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[studio-onboarding] profile fetch error:", profileError);
    return redirect("/sign-in");
  }

  if (!profile) {
    return redirect("/");
  }

  if (profile.role === "artist") {
    return redirect("/artist/onboarding");
  }

  if (profile.role !== "studio_manager") {
    return redirect("/");
  }

  // If studio already exists, send to dashboard
  const { data: existing, error: existingError } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", user.id)
    .eq("kind", "studio")
    .maybeSingle();

  if (existingError) {
    console.error("[studio-onboarding] provider check error:", existingError);
    // Continue to onboarding if we can't verify
  }

  if (existing) {
    return redirect("/studios/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <StudioOnboardingWizard
        userId={user.id}
        initialName={profile.full_name || ""}
      />
    </div>
  );
}
