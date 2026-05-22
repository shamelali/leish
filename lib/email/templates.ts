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
    <p>Thank you for booking with Beaute. Your appointment has been confirmed.</p>
    
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
    <p>© 2026 Beaute. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Booking Confirmed - ${bookingId}

Hi ${customerName},

Thank you for booking with Beaute. Your appointment has been confirmed.

BOOKING DETAILS:
- Reference: ${bookingId}
- Service: ${serviceName}
- Provider: ${providerName}
- Date: ${date}
- Time: ${time}
- Amount Paid: MYR ${amount} (${paymentType === "deposit" ? "30% Deposit" : "Full Payment"})

View your bookings: https://www.leish.my/bookings

If you need to reschedule or cancel, please contact us at hello@leish.my

© 2026 Beaute. All rights reserved.
  `

  return { subject, html, text }
}

export function welcomeEmailTemplate(params: { name: string }) {
  const subject = "Welcome to Beaute!"
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Beaute</title>
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
    <h1>Welcome to Beaute</h1>
  </div>
  
  <div class="content">
    <p>Hi ${params.name},</p>
    <p>Welcome to Beaute! We're thrilled to have you join our community of beauty enthusiasts.</p>
    <p>Discover top makeup artists, book appointments, and find your perfect look.</p>
    
    <p style="text-align: center;">
      <a href="https://www.leish.my/artists" class="button">Explore Artists</a>
    </p>
  </div>
  
  <div class="footer">
    <p>© 2026 Beaute. All rights reserved.</p>
  </div>
</body>
</html>
  `

  const text = `
Welcome to Beaute!

Hi ${params.name},

Welcome to Beaute! We're thrilled to have you join our community of beauty enthusiasts.

Discover top makeup artists, book appointments, and find your perfect look.

Explore Artists: https://www.leish.my/artists

© 2026 Beaute. All rights reserved.
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
      <p>© 2026 Beaute. All rights reserved.</p>
    </div>
  </body>
  </html>
  `
  const text = `Message for Shamel\n\nHi ${params.name},\n\n${params.message}\n\n© 2026 Beaute. All rights reserved.`
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
    <p>© 2026 Beaute. All rights reserved.</p>
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

© 2026 Beaute. All rights reserved.
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
    <p>© 2026 Beaute. All rights reserved.</p>
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

© 2026 Beaute. All rights reserved.
  `

  return { subject, html, text }
}
