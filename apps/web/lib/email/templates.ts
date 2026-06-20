export function bookingConfirmationTemplate(params: {
  customerName: string
  bookingId: string
  serviceName: string
  providerName: string
  date: string
  time: string
  amount: number
  paymentType: "full" | "deposit"
}) {
  const { customerName, bookingId, serviceName, providerName, date, time, amount, paymentType } = params
  
  const subject = `Booking Confirmed - ${bookingId}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #c9a96e; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Confirmed</h1>
    <p>Your appointment is all set!</p>
  </div>
  
  <div class="content">
    <p>Hi ${customerName},</p>
    <p>Thank you for booking with Leish. Your appointment has been confirmed.</p>
    
    <div class="details">
      <h3>Booking Details</h3>
      <div class="detail-row">
        <span>Reference:</span>
        <strong>${bookingId}</strong>
      </div>
      <div class="detail-row">
        <span>Service:</span>
        <strong>${serviceName}</strong>
      </div>
      <div class="detail-row">
        <span>Provider:</span>
        <strong>${providerName}</strong>
      </div>
      <div class="detail-row">
        <span>Date:</span>
        <strong>${date}</strong>
      </div>
      <div class="detail-row">
        <span>Time:</span>
        <strong>${time}</strong>
      </div>
      <div class="detail-row">
        <span>Amount Paid:</span>
        <strong>MYR ${amount} (${paymentType === "deposit" ? "30% Deposit" : "Full Payment"})</strong>
      </div>
    </div>
    
    <p style="text-align: center;">
      <a href="https://www.leish.my/bookings" class="button">View My Bookings</a>
    </p>
  </div>
  
  <div class="footer">
    <p>If you need to reschedule or cancel, please contact us at hello@leish.my</p>
    <p>© 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Booking Confirmed - ${bookingId}

Hi ${customerName},

Thank you for booking with Leish. Your appointment has been confirmed.

BOOKING DETAILS:
- Reference: ${bookingId}
- Service: ${serviceName}
- Provider: ${providerName}
- Date: ${date}
- Time: ${time}
- Amount Paid: MYR ${amount} (${paymentType === "deposit" ? "30% Deposit" : "Full Payment"})

View your bookings: https://www.leish.my/bookings

If you need to reschedule or cancel, please contact us at hello@leish.my

© 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function welcomeEmailTemplate(params: { name: string }) {
  const subject = "Welcome to Leish!"
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Leish</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Leish</h1>
  </div>
  
  <div class="content">
    <p>Hi ${params.name},</p>
    <p>Welcome to Leish! We're thrilled to have you join our community of beauty enthusiasts.</p>
    <p>Discover top makeup artists, book appointments, and find your perfect look.</p>
    
    <p style="text-align: center;">
      <a href="https://www.leish.my/artists" class="button">Explore Artists</a>
    </p>
  </div>
  
  <div class="footer">
    <p>© 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Welcome to Leish!

Hi ${params.name},

Welcome to Leish! We're thrilled to have you join our community of beauty enthusiasts.

Discover top makeup artists, book appointments, and find your perfect look.

Explore Artists: https://www.leish.my/artists

© 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function shamelNotificationTemplate(params: { name: string; message: string }) {
  const subject = `Message for Shamel`
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Message for Shamel</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
      .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
      .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Message for Shamel</h1>
    </div>
    <div class="content">
      <p>Hi ${params.name},</p>
      <p>${params.message}</p>
    </div>
    <div class="footer">
      <p>© 2026 Leish. All rights reserved.</p>
    </div>
  </body>
  </html>
  `
  const text = `Message for Shamel\n\nHi ${params.name},\n\n${params.message}\n\n© 2026 Leish. All rights reserved.`
  return { subject, html, text }
}

export function paymentReceiptTemplate(params: {
  customerName: string
  bookingId: string
  amount: number
  paymentMethod: string
  date: string
}) {
  const subject = `Payment Receipt - ${params.bookingId}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .receipt { background: white; padding: 20px; margin: 20px 0; }
    .amount { font-size: 32px; color: #c9a96e; text-align: center; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Payment Receipt</h1>
  </div>
  
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Thank you for your payment. Here's your receipt.</p>
    
    <div class="receipt">
      <div class="amount">MYR ${params.amount}</div>
      <p style="text-align: center; color: #666;">Paid on ${params.date}</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      
      <p><strong>Booking Reference:</strong> ${params.bookingId}</p>
      <p><strong>Payment Method:</strong> ${params.paymentMethod}</p>
    </div>
  </div>
  
  <div class="footer">
    <p>© 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Payment Receipt - ${params.bookingId}

Hi ${params.customerName},

Thank you for your payment. Here's your receipt.

Amount: MYR ${params.amount}
Paid on: ${params.date}
Booking Reference: ${params.bookingId}
Payment Method: ${params.paymentMethod}

© 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function notificationEmailTemplate(params: {
  name: string
  title: string
  body: string
  type: string
}) {
  const subject = params.title

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${params.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
    .tag { display: inline-block; background: #c9a96e; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <span class="tag">${params.type}</span>
    <h1>${params.title}</h1>
  </div>
  <div class="content">
    <p>Hi ${params.name},</p>
    <p>${params.body}</p>
    <p style="text-align: center;">
      <a href="https://www.leish.my/account" class="button">View in Account</a>
    </p>
  </div>
  <div class="footer">
    <p>© 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
${params.title}

Hi ${params.name},

${params.body}

View in your account: https://www.leish.my/account

© 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function bookingReminderTemplate(params: {
  customerName: string
  bookingId: string
  serviceName: string
  providerName: string
  date: string
  time: string
  location?: string
}) {
  const subject = `Reminder: Your appointment tomorrow - ${params.bookingId}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Appointment Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #c9a96e; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #c9a96e; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Appointment Reminder</h1>
    <p>Your booking is tomorrow!</p>
  </div>
  
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>This is a friendly reminder about your upcoming appointment.</p>
    
    <div class="details">
      <h3>Booking Details</h3>
      <div class="detail-row">
        <span>Reference:</span>
        <strong>${params.bookingId}</strong>
      </div>
      <div class="detail-row">
        <span>Service:</span>
        <strong>${params.serviceName}</strong>
      </div>
      <div class="detail-row">
        <span>Provider:</span>
        <strong>${params.providerName}</strong>
      </div>
      <div class="detail-row">
        <span>Date:</span>
        <strong>${params.date}</strong>
      </div>
      <div class="detail-row">
        <span>Time:</span>
        <strong>${params.time}</strong>
      </div>
      ${params.location ? `
      <div class="detail-row">
        <span>Location:</span>
        <strong>${params.location}</strong>
      </div>
      ` : ''}
    </div>
    
    <p style="text-align: center;">
      <a href="https://www.leish.my/bookings" class="button">View Booking</a>
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 20px;">
      Need to reschedule? Please contact us at least 24 hours in advance at hello@leish.my
    </p>
  </div>
  
  <div class="footer">
    <p>© 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Appointment Reminder - ${params.bookingId}

Hi ${params.customerName},

This is a friendly reminder about your upcoming appointment.

BOOKING DETAILS:
- Reference: ${params.bookingId}
- Service: ${params.serviceName}
- Provider: ${params.providerName}
- Date: ${params.date}
- Time: ${params.time}
${params.location ? `- Location: ${params.location}` : ''}

View your booking: https://www.leish.my/bookings

Need to reschedule? Please contact us at least 24 hours in advance at hello@leish.my

&copy; 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function bookingExpiredTemplate(params: {
  customerName: string
  bookingId: string
  providerName: string
  amount: number
  createdAt: string
}) {
  const subject = `Your Booking Has Expired - ${params.bookingId}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Expired</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Expired</h1>
  </div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Your booking with <strong>${params.providerName}</strong> has expired because payment was not completed within 2 hours.</p>
    <div class="details">
      <h3>Booking Details</h3>
      <div class="detail-row">
        <span>Reference:</span>
        <strong>${params.bookingId}</strong>
      </div>
      <div class="detail-row">
        <span>Amount:</span>
        <strong>MYR ${params.amount}</strong>
      </div>
      <div class="detail-row">
        <span>Created:</span>
        <strong>${params.createdAt}</strong>
      </div>
    </div>
    <p>You can make a new booking at any time.</p>
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/artists" class="button">Browse Artists</a>
    </p>
  </div>
  <div class="footer">
    <p>If you have questions, contact us at hello@leish.my</p>
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Booking Expired - ${params.bookingId}

Hi ${params.customerName},

Your booking with ${params.providerName} has expired because payment was not completed within 2 hours.

BOOKING DETAILS:
- Reference: ${params.bookingId}
- Amount: MYR ${params.amount}
- Created: ${params.createdAt}

Browse Artists: ${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/artists

Contact us at hello@leish.my if you have questions.

&copy; 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function bookingAutoCanceledTemplate(params: {
  bookingId: string
}) {
  const subject = `Booking Auto-Canceled - ${params.bookingId}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Auto-Canceled</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Auto-Canceled</h1>
  </div>
  <div class="content">
    <p>Hi,</p>
    <p>Your booking <strong>${params.bookingId}</strong> has been automatically canceled because the provider did not respond within 24 hours.</p>
    <p>You can make a new booking at any time.</p>
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/artists" class="button">Browse Artists</a>
    </p>
  </div>
  <div class="footer">
    <p>If you have questions, contact us at hello@leish.my</p>
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Booking Auto-Canceled - ${params.bookingId}

Hi,

Your booking ${params.bookingId} has been automatically canceled because the provider did not respond within 24 hours.

Browse Artists: ${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/artists

Contact us at hello@leish.my if you have questions.

&copy; 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function loyaltyPointsEarnedTemplate(params: {
  customerName: string
  bookingId: string
  pointsEarned: number
  currentBalance: number
  tier: string
}) {
  const tierEmoji: Record<string, string> = { bronze: "\u{1F949}", silver: "\u{1F948}", gold: "\u{1F947}", platinum: "\u{1F48E}" }
  const emoji = tierEmoji[params.tier] || "\u{1F3C6}"
  const subject = `${emoji} You earned ${params.pointsEarned} points!`

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
    <h1>${emoji} Points Earned!</h1>
  </div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Great news! You've earned points from your recent booking.</p>
    <div class="points-card">
      <div class="points-value">+${params.pointsEarned}</div>
      <p>Points Earned</p>
      <div class="tier-badge">${params.tier.charAt(0).toUpperCase() + params.tier.slice(1)} Member</div>
      <div class="balance">Balance: ${params.currentBalance} points</div>
    </div>
    <p>Keep booking to earn more points and unlock exclusive benefits!</p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Points Earned - ${params.bookingId}

Hi ${params.customerName},

You've earned ${params.pointsEarned} points from your recent booking!

Balance: ${params.currentBalance} points
Tier: ${params.tier.charAt(0).toUpperCase() + params.tier.slice(1)} Member

Keep booking to earn more points and unlock exclusive benefits!

&copy; 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function providerNewBookingTemplate(params: {
  providerName: string
  customerName: string
  bookingId: string
  serviceName: string
  date: string
  time: string
}) {
  const subject = `New Booking Received - ${params.bookingId}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #059669; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>New Booking!</h1>
  </div>
  <div class="content">
    <p>Hi ${params.providerName},</p>
    <p>You've received a new booking from <strong>${params.customerName}</strong>.</p>
    <div class="details">
      <h3>Booking Details</h3>
      <div class="detail-row">
        <span>Reference:</span>
        <strong>${params.bookingId}</strong>
      </div>
      <div class="detail-row">
        <span>Service:</span>
        <strong>${params.serviceName}</strong>
      </div>
      <div class="detail-row">
        <span>Date:</span>
        <strong>${params.date}</strong>
      </div>
      <div class="detail-row">
        <span>Time:</span>
        <strong>${params.time}</strong>
      </div>
    </div>
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/artist/bookings" class="button">View Booking</a>
    </p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
New Booking Received - ${params.bookingId}

Hi ${params.providerName},

You've received a new booking from ${params.customerName}.

BOOKING DETAILS:
- Reference: ${params.bookingId}
- Service: ${params.serviceName}
- Date: ${params.date}
- Time: ${params.time}

View Booking: ${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/artist/bookings

&copy; 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function subscriptionCreatedTemplate(params: {
  customerName: string
  planName: string
  amount: number
}) {
  const subject = `Pro Subscription Activated - ${params.planName}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pro Subscription Activated</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #c9a96e 0%, #d4b896 100%); color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .plan-card { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 12px; }
    .plan-name { font-size: 28px; font-weight: bold; color: #c9a96e; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Pro!</h1>
  </div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Your Pro subscription has been activated!</p>
    <div class="plan-card">
      <div class="plan-name">${params.planName}</div>
      <p>MYR ${params.amount}/month</p>
    </div>
    <p>You now have access to all Pro features including priority listing, advanced analytics, and more.</p>
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/account" class="button">View Account</a>
    </p>
  </div>
  <div class="footer">
    <p>If you have questions, contact us at hello@leish.my</p>
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Pro Subscription Activated - ${params.planName}

Hi ${params.customerName},

Your Pro subscription has been activated!

Plan: ${params.planName}
Amount: MYR ${params.amount}/month

You now have access to all Pro features.

View Account: ${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/account

Contact us at hello@leish.my if you have questions.

&copy; 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}

export function subscriptionCanceledTemplate(params: {
  customerName: string
  planName: string
  cancelDate: string
}) {
  const subject = `Pro Subscription Canceled`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pro Subscription Canceled</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6b7280; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Subscription Canceled</h1>
  </div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Your <strong>${params.planName}</strong> subscription has been canceled and will not renew.</p>
    <p>Your Pro benefits will remain active until <strong>${params.cancelDate}</strong>.</p>
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/pro/upgrade" class="button">Resubscribe</a>
    </p>
  </div>
  <div class="footer">
    <p>If you have questions, contact us at hello@leish.my</p>
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Subscription Canceled

Hi ${params.customerName},

Your ${params.planName} subscription has been canceled and will not renew.

Your Pro benefits will remain active until ${params.cancelDate}.

Resubscribe: ${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/pro/upgrade

Contact us at hello@leish.my if you have questions.

&copy; 2026 Leish. All rights reserved.
  `

  return { subject, html, text }
}
