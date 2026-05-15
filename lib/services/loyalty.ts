import { getSql } from "@/lib/db/postgres"
import { sendEmail } from "@/lib/email/brevo"

export interface LoyaltyConfig {
  id: string
  points_per_booking: number
  points_value_myr: number
  min_redemption_points: number
  tier_thresholds: Record<string, number>
  tier_bonuses: Record<string, number>
}

export interface LoyaltyStatus {
  points: number
  pointsTotalEarned: number
  pointsTotalRedeemed: number
  tier: string
  memberSince: Date
  tierThresholds: Record<string, number>
  currentTierBonus: number
}

export interface PointsRedemption {
  bookingId: string
  pointsUsed: number
  discountAmount: number
}

export const loyaltyService = {
  async getConfig(): Promise<LoyaltyConfig | null> {
    const sql = getSql()
    const [config] = await sql`
      SELECT * FROM public.loyalty_config WHERE id = 'default'
    `
    return (config as LoyaltyConfig) || null
  },

  async getUserStatus(userId: string): Promise<LoyaltyStatus | null> {
    const sql = getSql()
    const [profile] = await sql`
      SELECT 
        points,
        points_total_earned,
        points_total_redeemed,
        loyalty_tier,
        member_since
      FROM public.profiles 
      WHERE id = ${userId}
    `

    if (!profile) return null

    const config = await this.getConfig()
    const tierThresholds = config?.tier_thresholds || { bronze: 0, silver: 500, gold: 1500, platinum: 3000 }
    const tierBonuses = config?.tier_bonuses || { bronze: 0, silver: 10, gold: 15, platinum: 20 }

    return {
      points: profile.points,
      pointsTotalEarned: profile.points_total_earned,
      pointsTotalRedeemed: profile.points_total_redeemed,
      tier: profile.loyalty_tier,
      memberSince: profile.member_since,
      tierThresholds,
      currentTierBonus: tierBonuses[profile.loyalty_tier] || 0,
    }
  },

  async getPointsHistory(userId: string, limit = 20) {
    const sql = getSql()
    return await sql`
      SELECT * FROM public.loyalty_points_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  },

  async calculateRedemption(userId: string, pointsToRedeem: number): Promise<PointsRedemption | null> {
    const status = await this.getUserStatus(userId)
    if (!status) return null

    const config = await this.getConfig()
    if (!config) return null

    if (pointsToRedeem < config.min_redemption_points) {
      throw new Error(`Minimum ${config.min_redemption_points} points required for redemption`)
    }

    if (pointsToRedeem > status.points) {
      throw new Error("Insufficient points")
    }

    const discountAmount = (pointsToRedeem / config.points_value_myr) * 1

    return {
      bookingId: "",
      pointsUsed: pointsToRedeem,
      discountAmount,
    }
  },

  async redeemPoints(
    userId: string,
    pointsToRedeem: number,
    bookingId?: string
  ): Promise<{ success: boolean; discount: number; newBalance: number }> {
    const config = await this.getConfig()
    if (!config) throw new Error("Loyalty config not found")

    if (pointsToRedeem < config.min_redemption_points) {
      throw new Error(`Minimum ${config.min_redemption_points} points required for redemption`)
    }

    const sql = getSql()
    
    // Use transaction to ensure atomicity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await sql.begin(async (tx: any) => {
      const [profile] = await tx`
        SELECT points FROM public.profiles WHERE id = ${userId} FOR UPDATE
      `

      if (!profile || profile.points < pointsToRedeem) {
        throw new Error("Insufficient points")
      }

      const discount = Math.floor(pointsToRedeem / config.points_value_myr)

      await tx`
        UPDATE public.profiles 
        SET 
          points = points - ${pointsToRedeem},
          points_total_redeemed = points_total_redeemed + ${pointsToRedeem}
        WHERE id = ${userId}
      `

      await tx`
        INSERT INTO public.loyalty_points_history (user_id, booking_id, points, type, description)
        VALUES (${userId}, ${bookingId || null}, ${pointsToRedeem}, 'redeem', 'Points redeemed for discount')
      `

      const [updated] = await tx`SELECT points FROM public.profiles WHERE id = ${userId}`

      return { discount, newBalance: updated.points }
    })

    return { success: true, discount: result.discount, newBalance: result.newBalance }
  },

  async sendPointsEarnedEmail(userId: string, bookingId: string, pointsEarned: number) {
    try {
      const sql = getSql()
      const [profile] = await sql`
        SELECT email, full_name, points FROM public.profiles WHERE id = ${userId}
      `

      if (!profile?.email) return

      const status = await this.getUserStatus(userId)
      const tierEmoji = { bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎" }
      const tier = status?.tier || "bronze"

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Points Earned</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #c9a96e 0%, #d4b896 100%); color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .points-card { background: white; padding: 30px; text-align: center; margin: 20px 0; border-radius: 12px; }
    .points-value { font-size: 48px; font-weight: bold; color: #c9a96e; }
    .tier-badge { display: inline-block; background: #1a1a1a; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; }
    .balance { font-size: 24px; margin-top: 10px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${tierEmoji[tier as keyof typeof tierEmoji]} Points Earned!</h1>
  </div>
  
  <div class="content">
    <p>Hi ${profile.full_name || "Valued Member"},</p>
    <p>Great news! You've earned points from your recent booking.</p>
    
    <div class="points-card">
      <div class="points-value">+${pointsEarned}</div>
      <p>Points Earned</p>
      <div class="tier-badge">${tier.charAt(0).toUpperCase() + tier.slice(1)} Member</div>
      <div class="balance">Balance: ${status?.points || 0} points</div>
    </div>
    
    <p>Keep booking to earn more points and unlock exclusive benefits!</p>
  </div>
  
  <div class="footer">
    <p>© 2026 Beaute. All rights reserved.</p>
  </div>
</body>
</html>
      `

      await sendEmail({
        to: profile.email,
        subject: `🎉 You earned ${pointsEarned} points!`,
        html,
        text: `Hi ${profile.full_name || "Valued Member"}, You've earned ${pointsEarned} points from your booking! Your balance: ${status?.points || 0} points. Keep booking to earn more! - Beaute`,
      })
    } catch (error) {
      console.error("Failed to send points earned email:", error)
    }
  },
}

export function formatLoyaltyPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`
  }
  return points.toString()
}

export function getTierProgress(currentPoints: number, tierThresholds: Record<string, number>): {
  currentTier: string
  nextTier: string | null
  progress: number
  pointsToNextTier: number
} {
  const tiers = ["bronze", "silver", "gold", "platinum"] as const
  
  let currentTier = "bronze"
  let nextTier: string | null = "silver"
  
  for (const tier of tiers) {
    if (currentPoints >= tierThresholds[tier]) {
      currentTier = tier
      const currentIndex = tiers.indexOf(tier)
      nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null
    }
  }

  if (!nextTier) {
    return { currentTier, nextTier: null, progress: 100, pointsToNextTier: 0 }
  }

  const currentThreshold = tierThresholds[currentTier]
  const nextThreshold = tierThresholds[nextTier]
  let progress = ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100

  if (currentPoints === currentThreshold) {
    progress = 100
  }

  return {
    currentTier,
    nextTier,
    progress: Math.min(100, Math.max(0, progress)),
    pointsToNextTier: nextThreshold - currentPoints,
  }
}