/**
 * Webhook Monitoring Cron Job
 * 
 * Runs every 5 minutes to:
 * 1. Check for failed webhooks
 * 2. Alert on missing webhooks for pending payments
 * 3. Track webhook delivery metrics
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/brevo"
// import { adminAlertTemplate } from "@/lib/email/templates"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cron secret for authorization
const CRON_SECRET = process.env.CRON_SECRET

interface WebhookAlert {
  type: "failed_webhook" | "missing_webhook" | "delayed_payment"
  severity: "critical" | "warning" | "info"
  bookingId: string
  paymentId?: string
  message: string
  details: Record<string, unknown>
}

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const alerts: WebhookAlert[] = []

  try {
    // 1. Check for payments stuck in pending for > 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: stuckPayments } = await supabase
      .from("payments")
      .select(`
        id,
        booking_id,
        status,
        provider,
        created_at,
        amount_myr,
        bookings!inner(
          customer_id,
          provider_id,
          total_amount_myr
        )
      `)
      .eq("status", "pending")
      .lt("created_at", thirtyMinutesAgo)
      .limit(50)

    if (stuckPayments) {
      for (const payment of stuckPayments) {
        alerts.push({
          type: "delayed_payment",
          severity: "warning",
          bookingId: payment.booking_id,
          paymentId: payment.id,
          message: `Payment pending for > 30 minutes`,
          details: {
            provider: payment.provider,
            amount: payment.amount_myr,
            createdAt: payment.created_at,
          },
        })
      }
    }

    // 2. Check for bookings in payment_required for > 1 hour (payment likely abandoned)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: abandonedBookings } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        created_at,
        total_amount_myr,
        customer_id,
        provider_id
      `)
      .eq("status", "payment_required")
      .lt("created_at", oneHourAgo)
      .limit(50)

    if (abandonedBookings) {
      for (const booking of abandonedBookings) {
        alerts.push({
          type: "missing_webhook",
          severity: "info",
          bookingId: booking.id,
          message: `Booking in payment_required for > 1 hour (likely abandoned)`,
          details: {
            amount: booking.total_amount_myr,
            createdAt: booking.created_at,
          },
        })
      }
    }

    // 3. Check webhook delivery success rate (if webhook_logs table exists)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    try {
      const { data: recentWebhooks } = await supabase
        .from("webhook_logs")
        .select("status, created_at")
        .gte("created_at", fiveMinutesAgo)

      if (recentWebhooks && recentWebhooks.length > 0) {
        const failedCount = recentWebhooks.filter((w) => w.status >= 400).length
        const failureRate = failedCount / recentWebhooks.length

        if (failureRate > 0.1) { // > 10% failure rate
          alerts.push({
            type: "failed_webhook",
            severity: "critical",
            bookingId: "system",
            message: `High webhook failure rate: ${(failureRate * 100).toFixed(1)}%`,
            details: {
              total: recentWebhooks.length,
              failed: failedCount,
              period: "last 5 minutes",
            },
          })
        }
      }
    } catch {
      // webhook_logs table may not exist, skip this check
    }

    // 4. Send alerts if any critical issues found
    const criticalAlerts = alerts.filter((a) => a.severity === "critical")
    const warningAlerts = alerts.filter((a) => a.severity === "warning")

    if (criticalAlerts.length > 0 || warningAlerts.length > 5) {
      await sendAlertEmail(criticalAlerts.length, warningAlerts.length, alerts.slice(0, 10))
    }

    // 5. Log monitoring results
    await supabase.from("monitoring_logs").insert({
      check_type: "webhook_monitor",
      status: criticalAlerts.length > 0 ? "alert" : "ok",
      details: {
        totalAlerts: alerts.length,
        critical: criticalAlerts.length,
        warning: warningAlerts.length,
        checkedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      alerts: {
        total: alerts.length,
        critical: criticalAlerts.length,
        warning: warningAlerts.length,
        info: alerts.filter((a) => a.severity === "info").length,
      },
      details: alerts,
    })
  } catch (error) {
    console.error("Webhook monitor error:", error)
    return NextResponse.json(
      { ok: false, error: "Monitor check failed" },
      { status: 500 }
    )
  }
}

async function sendAlertEmail(
  criticalCount: number,
  warningCount: number,
  sampleAlerts: WebhookAlert[]
) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!adminEmail) return

  const alertList = sampleAlerts
    .map(
      (a) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.severity.toUpperCase()}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.type}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.bookingId}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${a.message}</td>
    </tr>
  `
    )
    .join("")

  const html = `
    <h2>🚨 Leish Webhook Monitor Alert</h2>
    <p><strong>Critical:</strong> ${criticalCount} | <strong>Warning:</strong> ${warningCount}</p>
    <p>Time: ${new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</p>
    
    <h3>Sample Alerts:</h3>
    <table style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 8px; border: 1px solid #ddd;">Severity</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Type</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Booking ID</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Message</th>
        </tr>
      </thead>
      <tbody>
        ${alertList}
      </tbody>
    </table>
    
    <p style="margin-top: 20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/payments" 
         style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none;">
        View Payment Dashboard
      </a>
    </p>
  `

  await sendEmail({
    to: adminEmail,
    subject: `🚨 Leish Webhook Alert: ${criticalCount} Critical, ${warningCount} Warnings`,
    html,
    text: `Webhook Alert: ${criticalCount} critical, ${warningCount} warnings. Check admin dashboard.`,
  })
}
