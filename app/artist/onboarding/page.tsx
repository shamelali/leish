import { redirect } from "next/navigation";
import { getSupabaseSsrClient } from "@/lib/supabase/ssr";
import { ArtistOnboardingWizard } from "@/components/artist-onboarding-wizard";

export const metadata = {
  title: "Set Up Your Profile | Leish!",
  description: "Complete your artist profile to start receiving bookings.",
};

export default async function ArtistOnboardingPage() {
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
    console.error("[onboarding] profile fetch error:", profileError);
    return redirect("/sign-in");
  }

  if (!profile || profile.role !== "artist") {
    return redirect("/");
  }

  // If they already have a provider, send to dashboard
  const { data: existing, error: existingError } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", user.id)
    .eq("kind", "artist")
    .maybeSingle();

  if (existingError) {
    console.error("[onboarding] provider check error:", existingError);
    // Continue to onboarding if we can't verify
  }

  if (existing) {
    return redirect("/artist");
  }

  return (
    <div className="min-h-screen bg-background">
      <ArtistOnboardingWizard
        userId={user.id}
        initialName={profile.full_name || ""}
      />
    </div>
  );
}
