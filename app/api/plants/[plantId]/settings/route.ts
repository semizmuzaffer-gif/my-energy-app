import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { writeErrorLog } from "@/lib/errorLog";

type RouteCtx = { params: Promise<{ plantId: string }> };

const defaultBase = {
  plantName: "",
  plantAddress: "",
  pcmCapacityKWh: 0,
  lifepo4CapacityKWh: 0,
  hasPV: true,
  pvAcPeakPower: 0,
  pvDcPeakPower: 0,
  gridFeedMode: "self-consume",
  maxFeedPower: 0,
  alwaysExportEnabled: false,
  alwaysExportPower: 150,
  alwaysImportEnabled: false,
  alwaysImportPower: 150,
  emsMode: "AUTO",
  maxGridPowerKw: 0,
  maxGenPowerKw: 0,
  demandLimitKw: 0,
  demandControlEnabled: true,
};

function rowToSettings(r: any) {
  return {
    plantName: r.plant_name ?? "",
    plantAddress: r.plant_address ?? "",
    pcmCapacityKWh: Number(r.pcm_capacity_kwh ?? 0),
    lifepo4CapacityKWh: Number(r.lifepo4_capacity_kwh ?? 0),
    hasPV: Boolean(r.has_pv),
    pvAcPeakPower: Number(r.pv_ac_peak_power ?? 0),
    pvDcPeakPower: Number(r.pv_dc_peak_power ?? 0),
    gridFeedMode: r.grid_feed_mode ?? "self-consume",
    maxFeedPower: Number(r.max_feed_power ?? 0),
    alwaysExportEnabled: Boolean(r.always_export_enabled),
    alwaysExportPower: Number(r.always_export_power ?? 150),
    alwaysImportEnabled: Boolean(r.always_import_enabled),
    alwaysImportPower: Number(r.always_import_power ?? 150),
    emsMode: r.ems_mode ?? "AUTO",
    maxGridPowerKw: Number(r.max_grid_power_kw ?? 0),
    maxGenPowerKw: Number(r.max_gen_power_kw ?? 0),
    demandLimitKw: Number(r.demand_limit_kw ?? 0),
    demandControlEnabled: Boolean(r.demand_control_enabled),
    updatedAt: new Date(r.updated_at).toISOString(),
    version: Number(r.version ?? 1),
  };
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { plantId } = await params;
  const pid = Number(plantId);

  try {
	 const pool = getPool(); 
    const latest = await pool.query(
      `select *
       from plant_settings
       where plant_id=$1
       order by version desc
       limit 1`,
      [pid]
    );

    if (latest.rowCount === 0) {
		const pool = getPool();
      const created = await pool.query(
        `insert into plant_settings (
          plant_id, plant_name, plant_address,
          pcm_capacity_kwh, lifepo4_capacity_kwh,
          has_pv, pv_ac_peak_power, pv_dc_peak_power,
          grid_feed_mode, max_feed_power,
          always_export_enabled, always_export_power,
          always_import_enabled, always_import_power,
          ems_mode, max_grid_power_kw, max_gen_power_kw,
          demand_limit_kw, demand_control_enabled,
          version, updated_at
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        returning *`,
        [
          pid,
          defaultBase.plantName,
          defaultBase.plantAddress,
          defaultBase.pcmCapacityKWh,
          defaultBase.lifepo4CapacityKWh,
          defaultBase.hasPV,
          defaultBase.pvAcPeakPower,
          defaultBase.pvDcPeakPower,
          defaultBase.gridFeedMode,
          defaultBase.maxFeedPower,
          defaultBase.alwaysExportEnabled,
          defaultBase.alwaysExportPower,
          defaultBase.alwaysImportEnabled,
          defaultBase.alwaysImportPower,
          defaultBase.emsMode,
          defaultBase.maxGridPowerKw,
          defaultBase.maxGenPowerKw,
          defaultBase.demandLimitKw,
          defaultBase.demandControlEnabled,
          1,
          new Date().toISOString(),
        ]
      );
      return NextResponse.json(rowToSettings(created.rows[0]));
    }

    return NextResponse.json(rowToSettings(latest.rows[0]));
  } catch (e: any) {
    await writeErrorLog({
      plantId: pid,
      route: `/api/plants/${plantId}/settings`,
      message: e?.message ?? "settings GET failed",
      stack: e?.stack,
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { plantId } = await params;
  const pid = Number(plantId);

  try {
    const body = await req.json();
	const pool = getPool();
    const prevRes = await pool.query(
      `select * from plant_settings where plant_id=$1 order by version desc limit 1`,
      [pid]
    );

    const prev = prevRes.rowCount ? rowToSettings(prevRes.rows[0]) : { ...defaultBase, updatedAt: new Date().toISOString(), version: 0 };

    const merged = { ...prev, ...body, updatedAt: new Date().toISOString() };

    // iş kuralı
    if (merged.alwaysExportEnabled) {
      merged.gridFeedMode = "export";
      merged.alwaysImportEnabled = false;
    }

    const nextVersion = (prev.version ?? 0) + 1;

    const saved = await pool.query(
      `insert into plant_settings (
        plant_id, plant_name, plant_address,
        pcm_capacity_kwh, lifepo4_capacity_kwh,
        has_pv, pv_ac_peak_power, pv_dc_peak_power,
        grid_feed_mode, max_feed_power,
        always_export_enabled, always_export_power,
        always_import_enabled, always_import_power,
        ems_mode, max_grid_power_kw, max_gen_power_kw,
        demand_limit_kw, demand_control_enabled,
        version, updated_at
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      returning *`,
      [
        pid,
        String(merged.plantName ?? ""),
        String(merged.plantAddress ?? ""),
        Number(merged.pcmCapacityKWh ?? 0),
        Number(merged.lifepo4CapacityKWh ?? 0),
        Boolean(merged.hasPV),
        Number(merged.pvAcPeakPower ?? 0),
        Number(merged.pvDcPeakPower ?? 0),
        String(merged.gridFeedMode ?? "self-consume"),
        Number(merged.maxFeedPower ?? 0),
        Boolean(merged.alwaysExportEnabled),
        Number(merged.alwaysExportPower ?? 150),
        Boolean(merged.alwaysImportEnabled),
        Number(merged.alwaysImportPower ?? 150),
        String(merged.emsMode ?? "AUTO"),
        Number(merged.maxGridPowerKw ?? 0),
        Number(merged.maxGenPowerKw ?? 0),
        Number(merged.demandLimitKw ?? 0),
        Boolean(merged.demandControlEnabled),
        nextVersion,
        merged.updatedAt,
      ]
    );

    return NextResponse.json({ ok: true, settings: rowToSettings(saved.rows[0]) });
  } catch (e: any) {
    await writeErrorLog({
      plantId: pid,
      route: `/api/plants/${plantId}/settings`,
      message: e?.message ?? "settings POST failed",
      stack: e?.stack,
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
