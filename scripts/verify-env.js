// Environment verification script - validates required env vars
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require("dotenv")

dotenv.config({ path: ".env.local" })

const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
]

const optionalVars = [
  "NEXT_PUBLIC_APP_URL",
  "DATABASE_URL",
  "STUDIO_SOURCE",
  "EXTERNAL_STUDIO_API_BASE_URL",
  "EXTERNAL_STUDIO_API_KEY"
]

function verifyEnv() {
  let hasError = false

  // Check required vars
  console.log("Checking required variables...")
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`❌ Missing required: ${varName}`)
      hasError = true
    } else {
      console.log(`✅ ${varName}`)
    }
  }

  // Check optional vars (just report if present)
  console.log("\nChecking optional variables...")
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} = ${process.env[varName].substring(0, 20)}...`)
    } else {
      console.log(`⚪ ${varName} (not set)`)
    }
  }

  if (hasError) {
    console.error("\n❌ Environment validation failed")
    process.exit(1)
  }

  console.log("\n✅ Environment variables verified")
  process.exit(0)
}

verifyEnv()
