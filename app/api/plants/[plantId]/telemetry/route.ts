// app/api/plants/[plantId]/telemetry/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { writeErrorLog } from "@/lib/errorLog";

type TelemetryInput = {
  timestamp?: string;

  p_total?: number; p_l1?: number; p_l2?: number; p_l3?: number;
  v_l1?: number; v_l2?: number; v_l3?: number;
  i_l1?: number; i_l2?: number; i_l3?: number;

  pcm_soc?: number;
  bat_soc?: number;
  mode?: string;
  meter_ok?: number;
};

function parsePlantId(raw: any): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function toInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function toText(v: any, max = 32) {
  if (v === undefined || v === null) return null;
  const s = String(v);
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * Timestamp normalizasyonu:
 * - sayı gelirse epoch saniye/ms ayıklar
 * - ISO string gelirse parse eder
 * - mantıksız (çok eski/çok ileri) ise null döner -> DB now() kullanır
 */
function toTs(v: any) {
  if (v === undefined || v === null || v === "") return null;

  const MIN = Date.UTC(2020, 0, 1);  // 2020-01-01
  const MAX = Date.UTC(2100, 0, 1);  // 2100-01-01

  // numeric epoch support
  if (typeof v === "number" || (typeof v === "string" && /^[0-9]+$/.test(v))) {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;

    const ms = n < 1e12 ? n * 1000 : n; // 10h->sec, 13h->ms varsay
    if (ms < MIN || ms > MAX) return null;

    return new Date(ms).toISOString();
  }

  // ISO string support
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;

  const t = d.getTime();
  if (t < MIN || t > MAX) return null;

  return d.toISOString();
}

function normalizePoint(p: any): TelemetryInput {
  return {
    timestamp: toTs(p?.timestamp) ?? undefined,

    // W isimleriyle gelenleri de tolere et
    p_total: toNum(p?.p_total ?? p?.p_total_w) ?? undefined,
    p_l1: toNum(p?.p_l1 ?? p?.p_l1_w) ?? undefined,
    p_l2: toNum(p?.p_l2 ?? p?.p_l2_w) ?? undefined,
    p_l3: toNum(p?.p_l3 ?? p?.p_l3_w) ?? undefined,

    v_l1: toNum(p?.v_l1 ?? p?.v_l1_v) ?? undefined,
    v_l2: toNum(p?.v_l2 ?? p?.v_l2_v) ?? undefined,
    v_l3: toNum(p?.v_l3 ?? p?.v_l3_v) ?? undefined,

    i_l1: toNum(p?.i_l1 ?? p?.i_l1_a) ?? undefined,
    i_l2: toNum(p?.i_l2 ?? p?.i_l2_a) ?? undefined,
    i_l3: toNum(p?.i_l3 ?? p?.i_l3_a) ?? undefined,

    pcm_soc: toNum(p?.pcm_soc) ?? undefined,
    bat_soc: toNum(p?.bat_soc) ?? undefined,
    mode: toText(p?.mode, 24) ?? undefined,
    meter_ok: toInt(p?.meter_ok) ?? undefined,
  };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ plantId: string }> }
) {
  const { plantId: plantIdStr } = await context.params;
  const plantId = parsePlantId(plantIdStr);

  if (!plantId) {
    return NextResponse.json({ error: "Invalid plantId" }, { status: 400 });
  }

  try {
    const body = await req.json();

    // Kabul edilen formatlar:
    // 1) Tek ölçüm: { ... }
    // 2) Batch: { points: [ {...}, {...} ] }
    // 3) Batch: [ {...}, {...} ]
    const pointsRaw: any[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.points)
        ? body.points
        : [body];

    const points = pointsRaw
      .map(normalizePoint)
      .filter(
        (p) =>
          p.p_total !== undefined ||
          p.p_l1 !== undefined ||
          p.v_l1 !== undefined ||
          p.pcm_soc !== undefined ||
          p.mode !== undefined
      );

    if (points.length === 0) {
      return NextResponse.json({ error: "No telemetry points" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const values: any[] = [];
      const chunks: string[] = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const base = i * 16;

        // ts null ise now() yaz
        chunks.push(
          `($${base + 1}, COALESCE($${base + 2}::timestamptz, now()), $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16})`
        );

        values.push(
          plantId,
          p.timestamp ?? null,
          toNum(p.p_total) ?? null,
          toNum(p.p_l1) ?? null,
          toNum(p.p_l2) ?? null,
          toNum(p.p_l3) ?? null,
          toNum(p.v_l1) ?? null,
          toNum(p.v_l2) ?? null,
          toNum(p.v_l3) ?? null,
          toNum(p.i_l1) ?? null,
          toNum(p.i_l2) ?? null,
          toNum(p.i_l3) ?? null,
          toNum(p.pcm_soc) ?? null,
          toNum(p.bat_soc) ?? null,
          toText(p.mode, 24) ?? null,
          toInt(p.meter_ok) ?? null
        );
      }

      await client.query(
        `
INSERT INTO telemetry_readings (
  plant_id, ts,
  p_total_w, p_l1_w, p_l2_w, p_l3_w,
  v_l1_v, v_l2_v, v_l3_v,
  i_l1_a, i_l2_a, i_l3_a,
  pcm_soc, bat_soc, mode, meter_ok
)
VALUES ${chunks.join(",")}
        `,
        values
      );

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({ ok: true, received: points.length }, { status: 201 });
     } catch (e: any) {
    await writeErrorLog({
      message: e?.message ?? "telemetry POST failed",
      stack: e?.stack,
      route: "/api/plants/[plantId]/telemetry",
      meta: {
        pg: {
          code: e?.code,
          detail: e?.detail,
          hint: e?.hint,
          where: e?.where,
          constraint: e?.constraint,
          table: e?.table,
          column: e?.column,
        },
      },
    });

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { error: "Server error", pg: { message: e?.message, code: e?.code, detail: e?.detail } },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }


}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ plantId: string }> }
) {
  const { plantId: plantIdStr } = await context.params;
  const plantId = parsePlantId(plantIdStr);

  if (!plantId) {
    return NextResponse.json({ error: "Invalid plantId" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const limitRaw = searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitRaw ?? 120), 1), 2000);

  try {
    const { rows } = await pool.query(
      `
SELECT
  ts,
  p_total_w, p_l1_w, p_l2_w, p_l3_w,
  v_l1_v, v_l2_v, v_l3_v,
  i_l1_a, i_l2_a, i_l3_a,
  pcm_soc, bat_soc, mode, meter_ok
FROM telemetry_readings
WHERE plant_id = $1
ORDER BY ts DESC
LIMIT $2
      `,
      [plantId, limit]
    );

    const points = rows.reverse().map((r: any) => ({
      timestamp: r.ts,
      p_total: r.p_total_w,
      p_l1: r.p_l1_w,
      p_l2: r.p_l2_w,
      p_l3: r.p_l3_w,
      v_l1: r.v_l1_v,
      v_l2: r.v_l2_v,
      v_l3: r.v_l3_v,
      i_l1: r.i_l1_a,
      i_l2: r.i_l2_a,
      i_l3: r.i_l3_a,
      pcm_soc: r.pcm_soc,
      bat_soc: r.bat_soc,
      mode: r.mode,
      meter_ok: r.meter_ok,
    }));

    const latest = points.length ? points[points.length - 1] : null;

    return NextResponse.json({ plantId, points, latest }, { status: 200 });
   } catch (e: any) {
    await writeErrorLog({
      message: e?.message ?? "telemetry GET failed",
      stack: e?.stack,
      route: "/api/plants/[plantId]/telemetry",
      meta: { pg: { code: e?.code, detail: e?.detail } },
    });

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { error: "Server error", pg: { message: e?.message, code: e?.code, detail: e?.detail } },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

}
