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
  const sql = getSql()
  const result = await sql`select now()::text as now`
  return { ok: true, now: result[0]?.now ?? "" }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withTransaction<T>(handler: (tx: any) => Promise<T>): Promise<T> {
  const sql = getSql()
  // @ts-expect-error - postgres.js begin method
  return sql.begin(handler)
}
