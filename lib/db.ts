// lib/db.ts
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function getConnectionString() {
  const cs = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  return cs && cs.trim().length > 0 ? cs : null;
}

export function getPool() {
  if (global.__pgPool) return global.__pgPool;

  const connectionString = getConnectionString();
  if (!connectionString) {
    // Bu hata Vercel loglarında net görünür
    throw new Error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is not set on server");
  }

  global.__pgPool = new Pool({
    connectionString,
    // Neon sslmode=require genelde yeterli ama bazı ortamlarda explicit ssl gerekebiliyor
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return global.__pgPool;
}
