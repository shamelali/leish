export type UserRole = "admin" | "artist" | "studio" | "customer"

export function getPostAuthRedirect(role: UserRole, hasProvider: boolean, slug?: string): string {
  if (role === "admin") return "/admin"
  if (role === "artist") {
    if (slug) return `/artists/${slug}`
    return hasProvider ? "/artist" : "/artist/onboarding"
  }
  if (role === "studio") {
    if (slug) return `/studios/${slug}`
    return hasProvider ? "/studios/dashboard" : "/studios/onboarding"
  }
  return "/account"
}
