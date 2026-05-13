import { DashboardShell, Panel, StatGrid } from "@/components/dashboard-shell";
import { getSupabaseSsrClient } from "@/lib/supabase/ssr";
import { surchargeService, surchargePresets } from "@/lib/services/surcharges";
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export const metadata = {
  title: "Charges & Fees | Leish Pro",
  description: "Manage additional charges, travel fees, and surcharges.",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ProChargesPage() {
  const supabase = await getSupabaseSsrClient();
  if (!supabase) return <p className="p-8">Not authenticated</p>;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <p className="p-8">Not authenticated</p>;

  const { data: prov } = await supabase
    .from("providers")
    .select(
      "id, free_travel_radius_km, travel_fee_per_km, max_travel_distance_km, outstation_flat_fee_myr",
    )
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  const surcharges = prov?.id
    ? await surchargeService.listByProvider(prov.id)
    : [];

  const travelConfig = {
    freeRadius: prov?.free_travel_radius_km ?? 0,
    perKm: prov?.travel_fee_per_km ?? 0,
    maxDistance: prov?.max_travel_distance_km ?? 100,
    outstationFee: prov?.outstation_flat_fee_myr ?? 0,
  };

  const stats = [
    {
      label: "Active Surcharges",
      value: String(surcharges.length),
      hint: "Configured fees",
    },
    {
      label: "Free Travel Radius",
      value: `${travelConfig.freeRadius} km`,
      hint: "No travel fee",
    },
    {
      label: "Travel Rate",
      value: `RM ${travelConfig.perKm}/km`,
      hint: "Beyond free radius",
    },
    {
      label: "Outstation Fee",
      value: `RM ${travelConfig.outstationFee}`,
      hint: "Max distance exceeded",
    },
  ];

  const nav = [
    { href: "/artist", label: "Overview" },
    { href: "/artist/bookings", label: "Bookings" },
    { href: "/artist/payments", label: "Payments" },
    { href: "/artist/reviews", label: "Reviews" },
    { href: "/artist/profile", label: "Profile" },
    { href: "/artist/availability", label: "Availability" },
    { href: "/artist/charges", label: "Charges & Fees", active: true },
  ];

  return (
    <DashboardShell
      title="Charges & Fees"
      subtitle="Configure additional charges, travel fees, and surcharges for your services."
      nav={nav}
    >
      <StatGrid stats={stats} />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Travel Fee Configuration */}
        <Panel
          title="Travel Fee Configuration"
          action={
            <span className="text-xs text-muted-foreground">
              Settings inline below
            </span>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <MapPin className="h-5 w-5 text-accent" />
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Free Travel Radius
                </p>
                <p className="text-sm text-muted-foreground">
                  {travelConfig.freeRadius > 0
                    ? `No travel fee within ${travelConfig.freeRadius} km`
                    : "No free travel radius set"}
                </p>
              </div>
              <span className="font-mono text-lg text-accent">
                {travelConfig.freeRadius} km
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <MapPin className="h-5 w-5 text-accent" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Travel Fee Rate</p>
                <p className="text-sm text-muted-foreground">
                  Per km beyond free radius
                </p>
              </div>
              <span className="font-mono text-lg text-accent">
                RM {travelConfig.perKm}
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Maximum Distance</p>
                <p className="text-sm text-muted-foreground">
                  Outstation flat fee applies beyond
                </p>
              </div>
              <span className="font-mono text-lg text-accent">
                {travelConfig.maxDistance} km
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Outstation Flat Fee
                </p>
                <p className="text-sm text-muted-foreground">
                  Fixed fee for distant locations
                </p>
              </div>
              <span className="font-mono text-lg text-accent">
                RM {travelConfig.outstationFee}
              </span>
            </div>
          </div>
        </Panel>

        {/* Active Surcharges */}
        <Panel
          title={`Active Surcharges (${surcharges.length})`}
          action={
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              Use presets below
            </span>
          }
        >
          <div className="space-y-3">
            {surcharges.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No surcharges configured yet
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Add fees for early morning, weekends, or additional services
                </p>
              </div>
            ) : (
              surcharges.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {s.appliesBeforeHour && (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                      {s.appliesAfterHour && (
                        <Clock className="h-4 w-4 text-indigo-500" />
                      )}
                      {s.appliesToDays?.length > 0 && (
                        <Calendar className="h-4 w-4 text-emerald-500" />
                      )}
                      {s.surchargeType === "per_person" && (
                        <Users className="h-4 w-4 text-blue-500" />
                      )}
                      <p className="font-medium text-foreground">{s.name}</p>
                    </div>
                    {s.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.appliesBeforeHour && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600">
                          Before {s.appliesBeforeHour}:00
                        </span>
                      )}
                      {s.appliesAfterHour && (
                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-600">
                          After {s.appliesAfterHour}:00
                        </span>
                      )}
                      {s.appliesToDays?.map((d) => (
                        <span
                          key={d}
                          className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600"
                        >
                          {DAY_NAMES[d]}
                        </span>
                      ))}
                      {s.minAdvanceBookingHours && (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-600">
                          &lt; {s.minAdvanceBookingHours}h notice
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg text-accent">
                      {s.surchargeType === "percentage"
                        ? `${s.percentage}%`
                        : `RM ${s.amountMyr}`}
                    </p>
                    <p className="text-[10px] uppercase text-muted-foreground">
                      {s.surchargeType}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* Quick Add Presets */}
      <div className="mt-6">
        <Panel title="Quick Add Presets">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(surchargePresets).map(([key, preset]) => (
              <form
                key={key}
                action={async () => {
                  "use server";
                  if (!prov?.id) return;
                  await surchargeService.create({
                    providerId: prov.id,
                    name: preset.name,
                    description: preset.description,
                    surchargeType: preset.surchargeType,
                    amountMyr: preset.amountMyr,
                    percentage:
                      (preset as { percentage?: number }).percentage ?? 0,
                    isActive: true,
                    appliesToDays:
                      (preset as { appliesToDays?: number[] }).appliesToDays ??
                      [],
                    appliesBeforeHour:
                      (preset as { appliesBeforeHour?: number })
                        .appliesBeforeHour ?? null,
                    appliesAfterHour:
                      (preset as { appliesAfterHour?: number })
                        .appliesAfterHour ?? null,
                    minAdvanceBookingHours:
                      (preset as { minAdvanceBookingHours?: number })
                        .minAdvanceBookingHours ?? null,
                  });
                }}
                className="group rounded-lg border border-border bg-background p-4 transition-all hover:border-accent"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{preset.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-accent">
                    {preset.surchargeType === "percentage"
                      ? `${(preset as { percentage?: number }).percentage ?? 0}%`
                      : `RM ${preset.amountMyr}`}
                  </span>
                </div>
                <button
                  type="submit"
                  className="mt-3 w-full rounded-full border border-border py-1.5 text-xs text-muted-foreground transition-all group-hover:border-accent group-hover:text-accent"
                >
                  + Add This Preset
                </button>
              </form>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
