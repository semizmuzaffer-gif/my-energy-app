import { pool } from "@/lib/db";

export async function writeErrorLog(input: {
  plantId?: number | null;
  source?: string;
  route?: string | null;
  level?: "info" | "warn" | "error";
  message: string;
  stack?: string | null;
  meta?: any;
}) {
  try {
    await pool.query(
      `insert into error_logs (plant_id, source, route, level, message, stack, meta)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [
        input.plantId ?? null,
        input.source ?? "server",
        input.route ?? null,
        input.level ?? "error",
        input.message,
        input.stack ?? null,
        input.meta ?? null,
      ]
    );
  } catch (e) {
    console.error("[error_logs] write failed:", e);
  }
}
