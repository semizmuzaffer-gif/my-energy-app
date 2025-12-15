import { NextResponse } from "next/server";
import { setLatestMeasurement } from "@/lib/measurementStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const measurement = {
      ...body,
      timestamp: new Date().toISOString(),
    };

    setLatestMeasurement(measurement);
    console.log("Yeni ölçüm alındı:", measurement);

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("POST /api/measurements hata:", err);
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }
}
