import { redirect } from "next/navigation"

export default function ArtistAvailabilityRedirect() {
  redirect("/artist/dashboard")
}
