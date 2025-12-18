// app/api/plants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { writeErrorLog } from "@/lib/errorLog";

type PhaseType = "three" | "single";

/* -----------------------------------------
   GET /api/plants
------------------------------------------ */
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

/* -----------------------------------------
   POST /api/plants
------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();

    // hem camelCase hem snake_case kabul et
    const addressRaw =
      body?.address ?? body?.address_text ?? body?.addressText ?? "";
    const address = String(addressRaw ?? "").trim();

    const plantKeyRaw = body?.plantKey ?? body?.plant_key ?? null;
    const plantKey =
      plantKeyRaw !== undefined &&
      plantKeyRaw !== null &&
      String(plantKeyRaw).trim() !== ""
        ? String(plantKeyRaw).trim()
        : null;

    const capacityRaw =
      body?.capacityKw ?? body?.capacity_kw ?? body?.capacity ?? 0;
    const capacityKw = Number(capacityRaw);

    const phaseRaw = body?.phaseType ?? body?.phase_type ?? "three";
    const phaseType: PhaseType =
      phaseRaw === "single" ? "single" : "three";

    if (!name) {
      return NextResponse.json({ error: "name zorunlu" }, { status: 400 });
    }
    if (!Number.isFinite(capacityKw) || capacityKw < 0) {
      return NextResponse.json(
        { error: "capacityKw geçersiz" },
        { status: 400 }
      );
    }

    const pool = getPool();

    // 1️⃣ Önce tesisi ekle
    const { rows } = await pool.query(
      `insert into plants (name, address, plant_key, capacity_kw, phase_type)
       values ($1, nullif($2,''), $3, $4, $5)
       returning id`,
      [name, address, plantKey, capacityKw, phaseType]
    );

    const id = Number(rows?.[0]?.id);

    // 2️⃣ plantKey girilmemişse -> plant_key = id
    if (!plantKey) {
      await pool.query(
        `update plants set plant_key = $1 where id = $2`,
        [String(id), id]
      );
    }

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e: any) {
    const msg = e?.message ?? "plants POST failed";
    await writeErrorLog({
      message: msg,
      stack: e?.stack,
      route: "/api/plants",
    });
    return NextResponse.json(
      {
        error: "Server error",
        detail:
          process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    );
  }
}


/* -----------------------------------------
   DELETE /api/plants  (Master password required)
------------------------------------------ */

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();

    const plantId = Number(body?.plantId);
    const masterPassword = String(body?.masterPassword ?? "").trim();

    if (!Number.isFinite(plantId) || plantId <= 0) {
      return NextResponse.json({ error: "Invalid plantId" }, { status: 400 });
    }

    const MASTER = String(process.env.MASTER_DELETE_PASSWORD ?? "").trim();

    // ENV yoksa net uyarı verelim (local debug)
    if (!MASTER) {
      return NextResponse.json(
        { error: "Server config missing: MASTER_DELETE_PASSWORD" },
        { status: 500 }
      );
    }

    if (masterPassword !== MASTER) {
      return NextResponse.json({ error: "Master şifre yanlış" }, { status: 401 });
    }

    const pool = getPool();
    const del = await pool.query(`delete from plants where id = $1 returning id`, [plantId]);

    if (del.rowCount === 0) {
      return NextResponse.json({ error: "Tesis bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: plantId });
  } catch (e: any) {
    const msg = e?.message ?? "plants DELETE failed";
    await writeErrorLog({ message: msg, stack: e?.stack, route: "/api/plants" });
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 });
  }
}

