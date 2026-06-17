import { redirect } from "next/navigation"

export default function ArtistPaymentsRedirect() {
  redirect("/artist/dashboard")
}
