export type UserRole = "admin" | "artist" | "studio" | "customer"

export function getPostAuthRedirect(role: UserRole, hasProvider: boolean, slug?: string): string {
  if (role === "admin")  return "/admin"
  if (role === "artist") return slug ? `/artists/${slug}` : hasProvider ? "/artist" : "/onboarding"
  if (role === "studio") return slug ? `/studios/${slug}` : hasProvider ? "/studios/dashboard" : "/onboarding"
  return "/account"
}
