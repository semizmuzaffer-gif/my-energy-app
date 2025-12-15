import { NextRequest, NextResponse } from "next/server";

type TelemetryPayload = {
  plantId: string;
  // Güçler (W)
  p_total: number;
  p_l1: number;
  p_l2: number;
  p_l3: number;
  // Gerilimler (V)
  v_l1: number;
  v_l2: number;
  v_l3: number;
  // Akımlar (A)
  i_l1: number;
  i_l2: number;
  i_l3: number;
  // Diğer
  mode: string;
  pcm_soc: number;
  bat_soc: number;
  meter_ok: number;
  timestamp: number; // ms
};

// Basit prototip: sadece RAM'de tutuyoruz
const latestByPlant: Record<string, TelemetryPayload> = {};

// --------- POST /api/plants/[plantId] ---------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ plantId: string }> }   // ✅ params artık Promise
) {
  const { plantId } = await params;                      // ✅ Promise'ten değeri al
  const body = await req.json();

  // Hem yeni (p_total, v_l1, i_l1) hem eski (totalPower, voltageL1, currentL1) isimleri destekle
  const p_total =
    (typeof body.p_total === "number" ? body.p_total : undefined) ??
    (typeof body.totalPower === "number" ? body.totalPower * 1000 : 0); // kW -> W varsayımı

  const payload: TelemetryPayload = {
    plantId,

    p_total,
    p_l1: body.p_l1 ?? 0,
    p_l2: body.p_l2 ?? 0,
    p_l3: body.p_l3 ?? 0,

    v_l1: body.v_l1 ?? body.voltageL1 ?? 0,
    v_l2: body.v_l2 ?? 0,
    v_l3: body.v_l3 ?? 0,

    i_l1: body.i_l1 ?? body.currentL1 ?? 0,
    i_l2: body.i_l2 ?? 0,
    i_l3: body.i_l3 ?? 0,

    mode: body.mode ?? "UNKNOWN",
    pcm_soc: body.pcm_soc ?? 0,
    bat_soc: body.bat_soc ?? 0,
    meter_ok: body.meter_ok ?? 0,

    timestamp: body.timestamp ?? Date.now(),
  };

  latestByPlant[plantId] = payload;

  console.log("💡 Yeni telemetri:", payload);

  return NextResponse.json({ ok: true });
}

// --------- GET /api/plants/[plantId] ---------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ plantId: string }> }   // ✅ burada da Promise
) {
  const { plantId } = await params;
  const snapshot = latestByPlant[plantId];

  if (!snapshot) {
    return NextResponse.json(
      { error: "No telemetry yet" },
      { status: 404 }
    );
  }

  return NextResponse.json(snapshot, { status: 200 });
}
