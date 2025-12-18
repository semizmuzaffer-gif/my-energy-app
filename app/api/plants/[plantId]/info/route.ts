// app/api/plants/[plantId]/info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { writeErrorLog } from "@/lib/errorLog";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ plantId: string }> };

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const resolved = await params;
  const plantId = Number.parseInt(resolved?.plantId ?? "", 10);

  if (!Number.isFinite(plantId) || plantId <= 0) {
    return NextResponse.json({ error: "Invalid plantId" }, { status: 400 });
  }

  try {
    const pool = getPool();

    const { rows } = await pool.query(
      `select
         id,
         name,
         address,
         timezone,
         is_active,
         capacity_kw,
         phase_type,
         created_at,
         updated_at,
         plant_key
       from plants
       where id = $1
       limit 1`,
      [plantId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    const r = rows[0];

    return NextResponse.json({
      id: Number(r.id),
      name: r.name ?? "",
      address: r.address ?? "",
      timezone: r.timezone ?? "Europe/Istanbul",
      isActive: Boolean(r.is_active),
      capacityKw: Number(r.capacity_kw ?? 0),
      phaseType: (r.phase_type ?? "three") as "single" | "three",
      plantKey: r.plant_key ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  } catch (e: any) {
    await writeErrorLog({
      plantId,
      route: `/api/plants/${plantId}/info`,
      message: e?.message ?? "plants info GET failed",
      stack: e?.stack,
    });

    return NextResponse.json(
      {
        error: "Server error",
        detail: process.env.NODE_ENV === "development" ? (e?.message ?? "") : undefined,
      },
      { status: 500 }
    );
  }
}
