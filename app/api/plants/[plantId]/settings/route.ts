// app/api/plants/[plantId]/settings/route.ts

import { NextRequest, NextResponse } from "next/server";

type GridFeedMode = "export" | "self-consume" | "no-export";
type EmsMode = "AUTO" | "PV_FIRST" | "GRID_FIRST" | "MANUAL";

export interface PlantSettingsValues {
  plantName: string;
  plantAddress: string;

  pcmCapacityKWh: number;
  lifepo4CapacityKWh: number;

  hasPV: boolean;
  pvAcPeakPower: number;
  pvDcPeakPower: number;

  gridFeedMode: GridFeedMode;
  maxFeedPower: number;

  alwaysExportEnabled: boolean;
  alwaysExportPower: number;

  alwaysImportEnabled: boolean;
  alwaysImportPower: number;

  emsMode: EmsMode;
  maxGridPowerKw: number;
  maxGenPowerKw: number;
  demandLimitKw: number;
  demandControlEnabled: boolean;

  updatedAt: string;
}

// ✅ Next.js type check ile uyumlu context
type RouteCtx = { params: Promise<{ plantId: string }> };

// Basit RAM-storage
const settingsByPlant: Record<string, PlantSettingsValues> = {};

const defaultSettingsBase = {
  plantName: "",
  plantAddress: "",
  pcmCapacityKWh: 0,
  lifepo4CapacityKWh: 0,
  hasPV: true,
  pvAcPeakPower: 0,
  pvDcPeakPower: 0,
  gridFeedMode: "self-consume" as GridFeedMode,
  maxFeedPower: 0,
  alwaysExportEnabled: false,
  alwaysExportPower: 150,
  alwaysImportEnabled: false,
  alwaysImportPower: 150,
  emsMode: "AUTO" as EmsMode,
  maxGridPowerKw: 0,
  maxGenPowerKw: 0,
  demandLimitKw: 0,
  demandControlEnabled: true,
};

// GET: Hem web UI hem ESP buradan okuyacak
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { plantId } = await params; // ✅ sadece burası değişti

  let current = settingsByPlant[plantId];
  if (!current) {
    current = {
      ...defaultSettingsBase,
      updatedAt: new Date().toISOString(),
    };
    settingsByPlant[plantId] = current;
  }

  return NextResponse.json(current);
}

// POST: Web UI'dan gelen güncellemeleri kaydet
export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { plantId } = await params; // ✅ sadece burası değişti

  let body: Partial<PlantSettingsValues>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Boş gövde gönderilemez" }, { status: 400 });
  }

  const prev = settingsByPlant[plantId] ?? {
    ...defaultSettingsBase,
    updatedAt: new Date().toISOString(),
  };

  const merged: PlantSettingsValues = {
    ...prev,
    ...body,
    updatedAt: new Date().toISOString(),
  };

  if (merged.alwaysExportEnabled) {
    merged.gridFeedMode = "export";
    merged.alwaysImportEnabled = false;
  }

  settingsByPlant[plantId] = merged;

  console.log("[Settings] Updated for plant", plantId, merged);

  return NextResponse.json({ ok: true, settings: merged });
}
