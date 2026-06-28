// Client-safe auth utilities
// This file intentionally does NOT import server-only modules like prisma or pg

export { signIn, signOut } from "next-auth/react"
export type { UserRole } from "../types"

// Re-export auth config for client use (no providers, no server-only callbacks)
export { authConfig } from "./config"
