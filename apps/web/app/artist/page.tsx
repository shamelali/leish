import { redirect } from "next/navigation"

export default function ArtistRedirect() {
  redirect("/artist/dashboard")
}
