import { Pool } from 'pg';
declare global { var _pgPool: Pool | undefined; }
function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
}
export const pool: Pool = process.env.NODE_ENV === 'production' ? createPool() : (global._pgPool ?? (global._pgPool = createPool()));
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try { const r = await client.query(text, params); return r.rows as T[]; } finally { client.release(); }
}
