// Utility script to verify Brevo email configuration
import { sendEmail } from "../lib/email/brevo"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function main() {
  const testTo = process.env.TEST_EMAIL_TO
  if (!testTo) {
    console.error("Please set TEST_EMAIL_TO in your .env file to receive the test email.")
    process.exit(1)
  }

  const result = await sendEmail({
    to: testTo,
    subject: "Leish – Test Email",
    html: "<p>This is a test email from the Leish project.</p>",
    text: "This is a test email from the Leish project.",
  })

  if (result.success) {
    console.log("✅ Test email sent successfully")
  } else {
    console.error("❌ Failed to send test email", result.error)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
