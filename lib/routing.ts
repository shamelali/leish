export type UserRole = "admin" | "artist" | "studio" | "customer"

export function getPostAuthRedirect(role: UserRole, _hasProvider?: boolean): string {
  if (role === "admin")  return "/admin"
  if (role === "artist") return "/artist"
  if (role === "studio") return "/studios/dashboard"
  return "/account"
}
