import { describe, expect, it } from "vitest"

import HomePage from "./page"

describe("app/page.tsx", () => {
  it("exports a homepage component", () => {
    expect(typeof HomePage).toBe("function")
  })
})
