// app/api/plants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { writeErrorLog } from "@/lib/errorLog";

type PhaseType = "three" | "single";

export async function GET() {
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
         updated_at
       from plants
       order by id desc`
    );

    // UI Plant tipine uyum: capacityKw / phaseType camelCase
    const mapped = rows.map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      address: r.address,
      timezone: r.timezone,
      isActive: Boolean(r.is_active),
      capacityKw: Number(r.capacity_kw ?? 0),
      phaseType: (r.phase_type ?? "three") as PhaseType,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json(mapped);
  } catch (e: any) {
    await writeErrorLog({
      message: e?.message ?? "plants GET failed",
      stack: e?.stack,
      route: "/api/plants",
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const address = String(body?.address ?? "").trim();
    const plantKey =
      body?.plantKey !== undefined && body?.plantKey !== null && String(body.plantKey).trim() !== ""
        ? String(body.plantKey).trim()
        : null;

    const capacityKw = Number(body?.capacityKw ?? 0);
    const phaseType: PhaseType = body?.phaseType === "single" ? "single" : "three";

    if (!name) {
      return NextResponse.json({ error: "name zorunlu" }, { status: 400 });
    }
    if (!Number.isFinite(capacityKw) || capacityKw < 0) {
      return NextResponse.json({ error: "capacityKw geçersiz" }, { status: 400 });
    }

	const pool = getPool();
    const { rows } = await pool.query(
      `insert into plants (name, address, plant_key, capacity_kw, phase_type)
       values ($1,$2,$3,$4,$5)
       returning id`,
      [name, address, plantKey, capacityKw, phaseType]
    );

    return NextResponse.json({ ok: true, id: Number(rows[0].id) }, { status: 201 });
  } catch (e: any) {
    await writeErrorLog({
      message: e?.message ?? "plants POST failed",
      stack: e?.stack,
      route: "/api/plants",
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
