import postgres from "postgres"

const connectionString = process.env.DATABASE_URL

const _sql = postgres(connectionString || "", {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: "require",
})

export default _sql

export function getSql() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }
  return _sql
}

export async function checkDatabaseHealth() {
  if (!connectionString) {
    return { ok: false, error: "DATABASE_URL is not set" }
  }
  try {
    const result = await _sql`select now()::text as now`
    return { ok: true, now: result[0]?.now ?? "" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { ok: false, error: message }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withTransaction<T>(handler: (tx: any) => Promise<T>): Promise<T> {
  const sql = getSql()
  // @ts-expect-error - postgres.js begin method
  return sql.begin(handler)
}
