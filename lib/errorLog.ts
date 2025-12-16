// lib/errorLog.ts
import { getPool } from "@/lib/db";

export async function writeErrorLog(input: {
  plantId?: number | null;
  source?: string;
  route?: string | null;
  level?: "error" | "info" | "warn";
  message: string;
  stack?: string | null;
  meta?: any;
}) {
  const pool = getPool();

  // Şema/tablo adlarını kendi yapına göre uyarlayabilirsin.
  // Varsayım: error_logs gibi bir tabloya yazıyorsun.
  await pool.query(
    `
    INSERT INTO error_logs (plant_id, source, route, level, message, stack, meta, ts)
    VALUES ($1, $2, $3, $4, $5, $6, $7, now())
    `,
    [
      input.plantId ?? null,
      input.source ?? null,
      input.route ?? null,
      input.level ?? "error",
      input.message,
      input.stack ?? null,
      input.meta ?? null,
    ]
  );
}
