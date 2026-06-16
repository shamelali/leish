import { redirect } from "next/navigation"

export default function ArtistProfileRedirect() {
  redirect("/artist/dashboard")
}
