// app/api/latest/route.ts

import { NextResponse } from "next/server";
import { getLatestMeasurement } from "@/lib/measurementStore";

export async function GET() {
  const data = getLatestMeasurement();

  if (!data) {
    return NextResponse.json(
      { error: "No data yet" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
