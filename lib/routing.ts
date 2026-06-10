export type UserRole = "admin" | "artist" | "studio" | "customer"

export function getPostAuthRedirect(role: UserRole, hasProvider: boolean): string {
  if (role === "admin")  return "/admin"
  if (role === "artist") return hasProvider ? "/artist" : "/onboarding"
  if (role === "studio") return hasProvider ? "/studios/dashboard" : "/onboarding"
  return "/account"
}
