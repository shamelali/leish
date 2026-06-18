export async function reportApiError(endpoint: string, error: unknown, context?: Record<string, unknown>) {
  console.error(`[API Error] ${endpoint}:`, error, context ?? "")
}
