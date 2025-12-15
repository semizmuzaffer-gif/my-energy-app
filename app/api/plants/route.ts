// app/api/plants/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Plant } from "@/lib/types";
import { getPlants, upsertPlant, removePlant } from "@/lib/sampleData";

function normalizePhaseType(str: string) {
  if (str === "single") return "single";
  if (str === "three") return "three";
  return "three";
}

// GET: tüm tesisleri döner (seed + runtime eklenenler)
export async function GET() {
  const plants = getPlants();
  return NextResponse.json(plants);
}

// POST: yeni tesis ekler / aynı ID varsa günceller
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON gövdesi" },
      { status: 400 }
    );
  }

  const plantId = Number(body.plantId);
  const name = String(body.name || "").trim();

  if (!plantId || plantId <= 0) {
    return NextResponse.json(
      { error: "Geçerli bir Tesis ID (plantId) zorunludur." },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json(
      { error: "Tesis adı zorunludur." },
      { status: 400 }
    );
  }

  const capacityKw = Number(body.capacityKw) || 0;
  const phaseType = normalizePhaseType(body.phaseType);
  const location = String(body.address || body.location || "");

  const newPlant: Plant = {
    id: plantId,
    name,
    location,
    capacityKw,
    phaseType,
    status: "online",
    lastUpdate: new Date().toISOString(),
  };

  upsertPlant(newPlant);

  console.log("[API] New/updated plant:", newPlant);

  return NextResponse.json(newPlant, { status: 201 });
}

// DELETE: body içinden plantId alıp tesisi siler
export async function DELETE(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON gövdesi" },
      { status: 400 }
    );
  }

  const plantId = Number(body.plantId ?? body.id);

  if (!plantId || plantId <= 0) {
    return NextResponse.json(
      { error: "Geçerli bir plantId zorunludur." },
      { status: 400 }
    );
  }

  const existed = removePlant(plantId);

  if (!existed) {
    return NextResponse.json(
      { error: "Tesis bulunamadı" },
      { status: 404 }
    );
  }

  console.log("🗑️ Tesis silindi:", plantId);

  return NextResponse.json(
    { success: true, plantId },
    { status: 200 }
  );
}
