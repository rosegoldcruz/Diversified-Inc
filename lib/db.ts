import { Pool, type QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Throw lazily at query time so `next build` (which evaluates server modules
  // without env) does not fail on environments that wire DATABASE_URL only at runtime.
  console.warn(
    "[db] DATABASE_URL is not set; queries will fail until it is configured.",
  );
}

let cachedPool: Pool | null = null;

function getPool(): Pool {
  if (cachedPool) return cachedPool;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  cachedPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  cachedPool.on("error", (err) => {
    console.error("[db] idle client error", err);
  });
  return cachedPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function withTransaction<T>(
  work: (
    q: <R extends QueryResultRow = QueryResultRow>(
      text: string,
      params?: unknown[],
    ) => Promise<R[]>,
  ) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const q = async <R extends QueryResultRow = QueryResultRow>(
      text: string,
      params: unknown[] = [],
    ): Promise<R[]> => {
      const r = await client.query<R>(text, params);
      return r.rows;
    };
    const result = await work(q);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}
