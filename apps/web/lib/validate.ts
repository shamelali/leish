import { NextRequest, NextResponse } from "next/server"
import type { ZodSchema, ZodError } from "zod"

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: NextRequest): Promise<{ data?: T; error?: NextResponse }> => {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) }
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const errors = formatZodError(parsed.error)
      return { error: NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 }) }
    }

    return { data: parsed.data }
  }
}

export function validateSearchParams<T extends Record<string, unknown>>(schema: ZodSchema<T>) {
  return (req: NextRequest): { data?: T; error?: NextResponse } => {
    const { searchParams } = new URL(req.url)
    const params: Record<string, string | null> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const parsed = schema.safeParse(params)
    if (!parsed.success) {
      const errors = formatZodError(parsed.error)
      return { error: NextResponse.json({ error: "Invalid parameters", details: errors }, { status: 400 }) }
    }

    return { data: parsed.data }
  }
}

export function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of error.errors) {
    const path = issue.path.join(".")
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  }
  return formatted
}

export async function parseFormData<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data?: T; error?: NextResponse }> {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return { error: NextResponse.json({ error: "Invalid form data" }, { status: 400 }) }
  }

  const entries: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === "string") {
      entries[key] = value
    }
  })

  const parsed = schema.safeParse(entries)
  if (!parsed.success) {
    const errors = formatZodError(parsed.error)
    return { error: NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 }) }
  }

  return { data: parsed.data }
}