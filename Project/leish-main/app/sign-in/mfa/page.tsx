import type { Metadata } from "next"
import { MFAChallenge } from "@/components/mfa-challenge"

export const metadata: Metadata = {
  title: "Two-Factor Authentication | Leish!",
  description: "Enter your authentication code to continue.",
}

export default function SignInMFAPage() {
  return <MFAChallenge />
}
