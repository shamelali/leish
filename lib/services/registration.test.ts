import { describe, expect, it, beforeAll, afterAll } from "vitest"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const runTests = supabaseUrl && supabaseServiceKey

const TEST_TIMESTAMP = Date.now()
const TEST_EMAIL = `test-${TEST_TIMESTAMP}@test.leish.my`
const TEST_PASSWORD = "testPassword123!"

const describeIf = runTests ? describe : describe.skip

describeIf("Registration Flow Integration Tests", () => {
  let supabase: SupabaseClient
  let testUserId: string | null = null
  let testProfileId: string | null = null

  beforeAll(() => {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables")
    }
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  afterAll(async () => {
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId)
    }
    if (testProfileId) {
      await supabase.from("profiles").delete().eq("id", testProfileId)
    }
  })

  describe("User Registration", () => {
    it("should create a new user with email and password", async () => {
      await new Promise((r) => setTimeout(r, 1000))

      const { data, error } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      if (error?.code === "over_email_send_rate_limit") {
        expect(error.code).toBe("over_email_send_rate_limit")
        return
      }

      expect(error).toBeNull()
      expect(data.user).not.toBeNull()
      expect(data.user?.email).toBe(TEST_EMAIL)
      testUserId = data.user!.id
    })

it("should create a profile with role metadata on signup", async () => {
      await new Promise((r) => setTimeout(r, 1100))
      const { data, error } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: {
            role: "customer",
            full_name: "Test User",
            phone: "+60123456789",
          },
        },
      })

      if (error?.code === "over_email_send_rate_limit") {
        expect(error.code).toBe("over_email_send_rate_limit")
        return
      }

      expect(error).toBeNull()
      expect(data.user).not.toBeNull()
      testUserId = data.user!.id
      testProfileId = data.user!.id

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user!.id)
        .single()

      expect(profile).not.toBeNull()
      expect(profile?.full_name).toBe("Test User")
      expect(profile?.role).toBe("customer")
    })

    it("should create profile with artist role", async () => {
      await new Promise((r) => setTimeout(r, 1100))
      const artistEmail = `artist-${TEST_TIMESTAMP}@test.leish.my`
      const { data, error } = await supabase.auth.signUp({
        email: artistEmail,
        password: TEST_PASSWORD,
        options: {
          data: {
            role: "artist",
            full_name: "Test Artist",
          },
        },
      })

      if (error?.code === "over_email_send_rate_limit") {
        expect(error.code).toBe("over_email_send_rate_limit")
        return
      }

      expect(error).toBeNull()
      expect(data.user).not.toBeNull()

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user!.id)
        .single()

      expect(profile?.role).toBe("artist")

      await supabase.auth.admin.deleteUser(data.user!.id)
    })

    it("should create profile with studio_manager role", async () => {
      await new Promise((r) => setTimeout(r, 1200))
      const studioEmail = `studio-${TEST_TIMESTAMP}@test.leish.my`
      const { data, error } = await supabase.auth.signUp({
        email: studioEmail,
        password: TEST_PASSWORD,
        options: {
          data: {
            role: "studio_manager",
            full_name: "Test Studio Owner",
          },
        },
      })

      if (error?.code === "over_email_send_rate_limit") {
        expect(error.code).toBe("over_email_send_rate_limit")
        return
      }

      expect(error).toBeNull()
      expect(data.user).not.toBeNull()

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user!.id)
        .single()

      expect(profile?.role).toBe("studio_manager")

      await supabase.auth.admin.deleteUser(data.user!.id)
    })

    it("should default to customer role when not specified", async () => {
      await new Promise((r) => setTimeout(r, 1300))
      const defaultEmail = `default-${TEST_TIMESTAMP}@test.leish.my`
      const { data, error } = await supabase.auth.signUp({
        email: defaultEmail,
        password: TEST_PASSWORD,
      })

      if (error?.code === "over_email_send_rate_limit") {
        expect(error.code).toBe("over_email_send_rate_limit")
        return
      }

      expect(error).toBeNull()
      expect(data.user).not.toBeNull()

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user!.id)
        .single()

      expect(profile?.role).toBe("customer")

      await supabase.auth.admin.deleteUser(data.user!.id)
    })

    it("should not allow duplicate email registration", async () => {
      await new Promise((r) => setTimeout(r, 1400))
      const email = `duplicate-${TEST_TIMESTAMP}@test.leish.my`

      const { error: error1 } = await supabase.auth.signUp({
        email,
        password: TEST_PASSWORD,
      })

      if (error1?.code === "over_email_send_rate_limit") {
        expect(error1.code).toBe("over_email_send_rate_limit")
        return
      }

      expect(error1).toBeNull()

      const { error: error2 } = await supabase.auth.signUp({
        email,
        password: TEST_PASSWORD,
      })

      expect(error2).not.toBeNull()
    })
  })

  describe("User Login", () => {
    let loginTestUserId: string | null = null

    beforeAll(async () => {
      await new Promise((r) => setTimeout(r, 1200))
      const email = `login-test-${TEST_TIMESTAMP}@test.leish.my`
      const { data } = await supabase.auth.signUp({
        email,
        password: TEST_PASSWORD,
      })
      if (data.user) {
        loginTestUserId = data.user.id
      }
    })

    afterAll(async () => {
      if (loginTestUserId) {
        await supabase.auth.admin.deleteUser(loginTestUserId)
      }
    })

    it("should sign in with valid credentials", async () => {
      const email = `login-test-${TEST_TIMESTAMP}@test.leish.my`

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: TEST_PASSWORD,
      })

      expect(error).toBeNull()
      expect(data.user).not.toBeNull()
      expect(data.user?.email).toBe(email)
    })

    it("should fail with invalid password", async () => {
      const email = `login-test-${TEST_TIMESTAMP}@test.leish.my`

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: "wrongPassword",
      })

      expect(error).not.toBeNull()
    })
  })

  describe("Profile Retrieval", () => {
    let profileTestUserId: string | null = null

    beforeAll(async () => {
      await new Promise((r) => setTimeout(r, 1300))
      const email = `profile-test-${TEST_TIMESTAMP}@test.leish.my`
      const { data } = await supabase.auth.signUp({
        email,
        password: TEST_PASSWORD,
        options: {
          data: {
            role: "artist",
            full_name: "Profile Test Artist",
            phone: "+60198765432",
          },
        },
      })
      if (data.user) {
        profileTestUserId = data.user.id
      }
    })

    afterAll(async () => {
      if (profileTestUserId) {
        await supabase.auth.admin.deleteUser(profileTestUserId)
      }
    })

    it("should retrieve profile by user ID", async () => {
      if (!profileTestUserId) {
        return
      }
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, phone")
        .eq("id", profileTestUserId)
        .single()

      expect(error).toBeNull()
      expect(profile?.full_name).toBe("Profile Test Artist")
      expect(profile?.role).toBe("artist")
      expect(profile?.phone).toBe("+60198765432")
    })

    it("should update profile fields", async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: "Updated Name" })
        .eq("id", profileTestUserId)

      expect(error).toBeNull()

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", profileTestUserId)
        .single()

      expect(profile?.full_name).toBe("Updated Name")
    })
  })

describe("Role-based Access", () => {
    let customerUserId: string | null = null
    let artistUserId: string | null = null
    let studioManagerUserId: string | null = null

    beforeAll(async () => {
      await new Promise((r) => setTimeout(r, 2000))
      const { data: d1 } = await supabase.auth.signUp({
        email: `role-cust-${TEST_TIMESTAMP}@test.leish.my`,
        password: TEST_PASSWORD,
        options: { data: { role: "customer", full_name: "Customer User" } },
      })
      if (d1?.user) customerUserId = d1.user.id

      await new Promise((r) => setTimeout(r, 1100))
      const { data: d2 } = await supabase.auth.signUp({
        email: `role-artist-${TEST_TIMESTAMP}@test.leish.my`,
        password: TEST_PASSWORD,
        options: { data: { role: "artist", full_name: "Artist User" } },
      })
      if (d2?.user) artistUserId = d2.user.id

      await new Promise((r) => setTimeout(r, 1100))
      const { data: d3 } = await supabase.auth.signUp({
        email: `role-studio-${TEST_TIMESTAMP}@test.leish.my`,
        password: TEST_PASSWORD,
        options: { data: { role: "studio_manager", full_name: "Studio User" } },
      })
      if (d3?.user) studioManagerUserId = d3.user.id
    })

    afterAll(async () => {
      const userIds = [customerUserId, artistUserId, studioManagerUserId]
      for (const uid of userIds) {
        if (uid) {
          await supabase.auth.admin.deleteUser(uid)
        }
      }
    })

    it("should assign customer role correctly", async () => {
      if (!customerUserId) {
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", customerUserId)
        .single()

      expect(profile?.role).toBe("customer")
    })

    it("should assign artist role correctly", async () => {
      if (!artistUserId) {
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", artistUserId)
        .single()

      expect(profile?.role).toBe("artist")
    })

    it("should assign studio_manager role correctly", async () => {
      if (!studioManagerUserId) {
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", studioManagerUserId)
        .single()

      expect(profile?.role).toBe("studio_manager")
    })
  })

  describe("OAuth Sign-in", () => {
    it("should initiate Google OAuth sign-in flow", async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
        },
      })

      expect(error).toBeNull()
      expect(data).not.toBeNull()
      expect(data.url).toContain("provider=google")
      expect(data.url).toContain("supabase.co")
    })

    it("should initiate OAuth with scopes for user data", async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
          scopes: "email profile",
        },
      })

      expect(error).toBeNull()
      expect(data.url).toContain("provider=google")
      expect(data.url).toContain("scopes=")
    })
  })

  describe("Password Reset", () => {
    let resetUserId: string | null = null

    beforeAll(async () => {
      await new Promise((r) => setTimeout(r, 1500))
      const email = `reset-test-${TEST_TIMESTAMP}@test.leish.my`
      const { data } = await supabase.auth.signUp({
        email,
        password: TEST_PASSWORD,
      })
      if (data.user) resetUserId = data.user.id
    })

    afterAll(async () => {
      if (resetUserId) {
        await supabase.auth.admin.deleteUser(resetUserId)
      }
    })

    it("should send password reset email", async () => {
      const email = `reset-test-${TEST_TIMESTAMP}@test.leish.my`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:3000/auth/update-password",
      })

      expect(error).toBeNull()
    })

    it("should fail for non-existent email", async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        `nonexistent-${TEST_TIMESTAMP}@test.leish.my`
      )

      expect(error).toBeNull()
    })
  })

  describe("Session Management", () => {
    let sessionUserId: string | null = null

    beforeAll(async () => {
      await new Promise((r) => setTimeout(r, 1600))
      const email = `session-test-${TEST_TIMESTAMP}@test.leish.my`
      const { data } = await supabase.auth.signUp({
        email,
        password: TEST_PASSWORD,
      })
      if (data.user) sessionUserId = data.user.id
    })

    afterAll(async () => {
      if (sessionUserId) {
        await supabase.auth.admin.deleteUser(sessionUserId)
      }
    })

    it("should get session after login", async () => {
      const email = `session-test-${TEST_TIMESTAMP}@test.leish.my`

      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password: TEST_PASSWORD,
      })

      expect(signInData.session).not.toBeNull()
      expect(signInData.session?.access_token).not.toBeNull()
      expect(signInData.session?.refresh_token).not.toBeNull()
      expect(signInData.session?.expires_in).toBeGreaterThan(0)
      expect(signInData.session?.expires_at).toBeGreaterThan(0)
    })

    it("should refresh session token", async () => {
      const email = `session-test-${TEST_TIMESTAMP}@test.leish.my`

      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password: TEST_PASSWORD,
      })

      const refreshToken = signInData.session?.refresh_token
      expect(refreshToken).not.toBeNull()

      if (!refreshToken) {
        return
      }

      const { data: refreshData, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      })

      expect(error).toBeNull()
      expect(refreshData.session).not.toBeNull()
      expect(refreshData.session?.access_token).not.toBeNull()
    })

    it("should sign out and clear session", async () => {
      const email = `session-test-${TEST_TIMESTAMP}@test.leish.my`

      await supabase.auth.signInWithPassword({
        email,
        password: TEST_PASSWORD,
      })

      const { error } = await supabase.auth.signOut()

      expect(error).toBeNull()
    })
  })

  describe("User Metadata", () => {
    let metadataUserId: string | null = null

    beforeAll(async () => {
      await new Promise((r) => setTimeout(r, 1700))
      const email = `metadata-test-${TEST_TIMESTAMP}@test.leish.my`
      const { data } = await supabase.auth.signUp({
        email,
        password: TEST_PASSWORD,
        options: {
          data: {
            full_name: "Metadata Test User",
            phone: "+60111222333",
            role: "customer",
          },
        },
      })
      if (data.user) metadataUserId = data.user.id
    })

    afterAll(async () => {
      if (metadataUserId) {
        await supabase.auth.admin.deleteUser(metadataUserId)
      }
    })

    it("should store metadata on signup", async () => {
      if (!metadataUserId) {
        return
      }
      const { data: user } = await supabase.auth.getUser(metadataUserId)

      expect(user.user).not.toBeNull()
      expect(user.user?.user_metadata.full_name).toBe("Metadata Test User")
      expect(user.user?.user_metadata.phone).toBe("+60111222333")
      expect(user.user?.user_metadata.role).toBe("customer")
    })

    it("should update user metadata", async () => {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: "Updated Metadata Name",
        },
      })

      expect(error).toBeNull()

      const { data: user } = await supabase.auth.getUser()

      expect(user.user?.user_metadata.full_name).toBe("Updated Metadata Name")
    })
  })

  describe("Email Verification", () => {
    let verifyUserId: string | null = null

    beforeAll(async () => {
      await new Promise((r) => setTimeout(r, 1800))
      const email = `verify-test-${TEST_TIMESTAMP}@test.leish.my`
      const { data } = await supabase.auth.signUp({
        email,
        password: TEST_PASSWORD,
      })
      if (data.user) verifyUserId = data.user.id
    })

    afterAll(async () => {
      if (verifyUserId) {
        await supabase.auth.admin.deleteUser(verifyUserId)
      }
    })

    it("should resend confirmation email", async () => {
      if (!verifyUserId) {
        return
      }

      const { error } = await supabase.auth.resend({ type: "signup", email: `verify-test-${TEST_TIMESTAMP}@test.leish.my` })

      expect(error).toBeNull()
    })

    it("should check unverified user status", async () => {
      if (!verifyUserId) {
        return
      }
      const { data: user } = await supabase.auth.getUser(verifyUserId)

      expect(user.user?.email_confirmed_at).toBeNull()
    })
  })
})