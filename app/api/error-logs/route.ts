import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const plantId = sp.get("plantId");
  const limit = Math.min(Number(sp.get("limit") ?? 50), 200);

  const where = plantId ? "where plant_id = $1" : "";
  const args = plantId ? [Number(plantId), limit] : [limit];

  const sql = plantId
    ? `select * from error_logs ${where} order by created_at desc limit $2`
    : `select * from error_logs order by created_at desc limit $1`;

const pool = getPool();
  const { rows } = await pool.query(sql, args);
  return NextResponse.json(rows);
}
