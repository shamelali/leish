"use client";

import { useEffect, useState } from "react";
import { Trophy, Star, Crown, Award, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/language-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface LoyaltyStatus {
  points: number;
  pointsTotalEarned: number;
  pointsTotalRedeemed: number;
  tier: string;
  memberSince: Date;
  tierThresholds: Record<string, number>;
  currentTierBonus: number;
}

const tierIcons = {
  bronze: Trophy,
  silver: Star,
  gold: Crown,
  platinum: Award,
};

const tierColors = {
  bronze: "bg-amber-600",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-purple-600",
};

export function LoyaltyStatusCard() {
  const [status, setStatus] = useState<LoyaltyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useTranslation();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) return;

        // This would normally call the loyalty service API
        // For now, we'll use mock data
        const mockStatus: LoyaltyStatus = {
          points: 450,
          pointsTotalEarned: 650,
          pointsTotalRedeemed: 200,
          tier: "gold",
          memberSince: new Date("2024-01-15"),
          tierThresholds: {
            bronze: 0,
            silver: 100,
            gold: 300,
            platinum: 1000,
          },
          currentTierBonus: 10,
        };
        setStatus(mockStatus);
      } catch (error) {
        console.error("Failed to fetch loyalty status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const currentTierIndex = Object.keys(status.tierThresholds).indexOf(
    status.tier,
  );
  const nextTier = Object.keys(status.tierThresholds)[currentTierIndex + 1];
  const nextTierThreshold = nextTier ? status.tierThresholds[nextTier] : null;
  const progressToNextTier = nextTierThreshold
    ? ((status.points - status.tierThresholds[status.tier]) /
        (nextTierThreshold - status.tierThresholds[status.tier])) *
      100
    : 100;

  const TierIcon = tierIcons[status.tier as keyof typeof tierIcons] || Trophy;

  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-20 h-20 ${tierColors[status.tier as keyof typeof tierColors]} opacity-10 rounded-bl-full`}
      ></div>

      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${tierColors[status.tier as keyof typeof tierColors]} text-foreground`}
          >
            <TierIcon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg capitalize flex items-center gap-2">
              {status.tier} {lang === "ms" ? "Tahap" : "Tier"}
              <Badge variant="secondary" className="text-xs">
                {status.currentTierBonus}% {lang === "ms" ? "Bonus" : "Bonus"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {lang === "ms" ? "Ahli sejak" : "Member since"}{" "}
              {status.memberSince.toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Points Balance */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {status.points.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">
            {lang === "ms" ? "Mata Kesetiaan" : "Loyalty Points"}
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="capitalize">
                {lang === "ms" ? "Seterusnya" : "Next"}: {nextTier}
              </span>
              <span>
                {status.points}/{nextTierThreshold}
              </span>
            </div>
            <Progress
              value={Math.min(progressToNextTier, 100)}
              className="h-2"
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              +{status.pointsTotalEarned}
            </div>
            <div className="text-xs text-muted-foreground">
              {lang === "ms" ? "Diperoleh" : "Earned"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              -{status.pointsTotalRedeemed}
            </div>
            <div className="text-xs text-muted-foreground">
              {lang === "ms" ? "Ditukar" : "Redeemed"}
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            {lang === "ms" ? "Pencapaian" : "Achievements"}
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              🎨 {lang === "ms" ? "Tempahan Pertama" : "First Booking"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              ⭐ {lang === "ms" ? "Ulasan 5 Bintang" : "5-Star Review"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              👑 {lang === "ms" ? "Pelanggan Setia" : "Loyal Customer"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
