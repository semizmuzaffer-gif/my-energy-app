// app/api/plants/[plantId]/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { writeErrorLog } from "@/lib/errorLog";

export const runtime = "nodejs";

type GridFeedMode =
  | "export"
  | "self-consume"
  | "no-export"
  | "no-import"
  | string;

type EmsMode = "AUTO" | "PV_FIRST" | "GRID_FIRST" | "MANUAL" | string;

const defaultBase = {
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

  // PID defaults
  pcmPidEnabled: false,
  batPidEnabled: false,
  pidKp: 1.0,
  pidKd: 0.0,
};

function pidNum(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v: any, fallback: boolean) {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  if (v === 0 || v === "0" || v === "false") return false;
  return fallback;
}

type Ctx = { params: Promise<{ plantId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { plantId } = await params;

  // ✅ Number() yerine parseInt (NaN riskini azaltır)
  const pid = Number.parseInt(plantId ?? "", 10);

  if (!Number.isFinite(pid) || pid <= 0) {
    return NextResponse.json({ error: "Invalid plantId" }, { status: 400 });
  }

  try {
    const pool = getPool();

    // 1) plants'tan isim/adres
    const p = await pool.query(`select name, address from plants where id=$1`, [
      pid,
    ]);
    if (p.rowCount === 0) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    // 2) plant_settings tek satır (yoksa oluştur)
    let s = await pool.query(
      `select * from plant_settings where plant_id=$1 limit 1`,
      [pid]
    );

    if (s.rowCount === 0) {
      await pool.query(
        `insert into plant_settings (
          plant_id,
          pcm_capacity_kwh, lifepo4_capacity_kwh,
          has_pv, pv_ac_peak_power, pv_dc_peak_power,
          grid_feed_mode, max_feed_power,
          always_export_enabled, always_export_power,
          always_import_enabled, always_import_power,
          ems_mode, max_grid_power_kw, max_gen_power_kw,
          demand_limit_kw, demand_control_enabled,
          pcm_pid_enabled, bat_pid_enabled, pid_kp, pid_kd,
          updated_at
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,now()
        )`,
        [
          pid,
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
          defaultBase.pcmPidEnabled,
          defaultBase.batPidEnabled,
          defaultBase.pidKp,
          defaultBase.pidKd,
        ]
      );

      s = await pool.query(
        `select * from plant_settings where plant_id=$1 limit 1`,
        [pid]
      );
    }

    const row = s.rows[0];

    return NextResponse.json({
      // plant bilgisi plants'tan gelir (tek doğru kaynak)
      plantName: p.rows[0].name ?? "",
      plantAddress: p.rows[0].address ?? "",

      // settings
      pcmCapacityKWh: Number(row.pcm_capacity_kwh ?? 0),
      lifepo4CapacityKWh: Number(row.lifepo4_capacity_kwh ?? 0),
      hasPV: Boolean(row.has_pv),
      pvAcPeakPower: Number(row.pv_ac_peak_power ?? 0),
      pvDcPeakPower: Number(row.pv_dc_peak_power ?? 0),
      gridFeedMode: (row.grid_feed_mode ?? "self-consume") as GridFeedMode,
      maxFeedPower: Number(row.max_feed_power ?? 0),
      alwaysExportEnabled: Boolean(row.always_export_enabled),
      alwaysExportPower: Number(row.always_export_power ?? 150),
      alwaysImportEnabled: Boolean(row.always_import_enabled),
      alwaysImportPower: Number(row.always_import_power ?? 150),
      emsMode: (row.ems_mode ?? "AUTO") as EmsMode,
      maxGridPowerKw: Number(row.max_grid_power_kw ?? 0),
      maxGenPowerKw: Number(row.max_gen_power_kw ?? 0),
      demandLimitKw: Number(row.demand_limit_kw ?? 0),
      demandControlEnabled: Boolean(row.demand_control_enabled),

      // PID
      pcmPidEnabled: Boolean(row.pcm_pid_enabled),
      batPidEnabled: Boolean(row.bat_pid_enabled),
      pidKp: Number(row.pid_kp ?? 1.0),
      pidKd: Number(row.pid_kd ?? 0.0),

      updatedAt: row.updated_at
        ? new Date(row.updated_at).toISOString()
        : new Date().toISOString(),
    });
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

export async function POST(req: NextRequest, { params }: Ctx) {
  const { plantId } = await params;

  // ✅ Number() yerine parseInt
  const pid = Number.parseInt(plantId ?? "", 10);

  if (!Number.isFinite(pid) || pid <= 0) {
    return NextResponse.json({ error: "Invalid plantId" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const pool = getPool();

    // ✅ DB'den mevcut plant name/address al (plantName boş gelirse fallback)
    const p0 = await pool.query(`select name, address from plants where id=$1`, [
      pid,
    ]);
    if (p0.rowCount === 0) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }

    const dbName = String(p0.rows[0]?.name ?? "").trim();
    const dbAddr = String(p0.rows[0]?.address ?? "").trim();

    // 1) Plant adı/adresi -> plants tablosuna yaz (Plantlar ekranı buradan besleniyor)
    // ✅ body boş gelirse DB'den tamamla
    const plantName = String(body?.plantName ?? "").trim() || dbName;
    const plantAddress = String(body?.plantAddress ?? "").trim() || dbAddr;

    // ✅ Hâlâ boşsa gerçekten sorun var
    if (!plantName) {
      return NextResponse.json({ error: "plantName zorunlu" }, { status: 400 });
    }

    await pool.query(
      `update plants set name=$1, address=$2, updated_at=now() where id=$3`,
      [plantName, plantAddress, pid]
    );

    // 2) business rule (alwaysExportEnabled)
    const alwaysExportEnabled = toBool(body?.alwaysExportEnabled, false);
    const alwaysImportEnabled = alwaysExportEnabled
      ? false
      : toBool(body?.alwaysImportEnabled, false);
    const gridFeedMode: GridFeedMode = alwaysExportEnabled
      ? "export"
      : String(body?.gridFeedMode ?? "self-consume");

    // 3) Settings -> upsert (tek satır)
    await pool.query(
      `insert into plant_settings (
         plant_id,
         pcm_capacity_kwh, lifepo4_capacity_kwh,
         has_pv, pv_ac_peak_power, pv_dc_peak_power,
         grid_feed_mode, max_feed_power,
         always_export_enabled, always_export_power,
         always_import_enabled, always_import_power,
         ems_mode, max_grid_power_kw, max_gen_power_kw,
         demand_limit_kw, demand_control_enabled,
         pcm_pid_enabled, bat_pid_enabled, pid_kp, pid_kd,
         updated_at
       ) values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,now()
       )
       on conflict (plant_id) do update set
         pcm_capacity_kwh=excluded.pcm_capacity_kwh,
         lifepo4_capacity_kwh=excluded.lifepo4_capacity_kwh,
         has_pv=excluded.has_pv,
         pv_ac_peak_power=excluded.pv_ac_peak_power,
         pv_dc_peak_power=excluded.pv_dc_peak_power,
         grid_feed_mode=excluded.grid_feed_mode,
         max_feed_power=excluded.max_feed_power,
         always_export_enabled=excluded.always_export_enabled,
         always_export_power=excluded.always_export_power,
         always_import_enabled=excluded.always_import_enabled,
         always_import_power=excluded.always_import_power,
         ems_mode=excluded.ems_mode,
         max_grid_power_kw=excluded.max_grid_power_kw,
         max_gen_power_kw=excluded.max_gen_power_kw,
         demand_limit_kw=excluded.demand_limit_kw,
         demand_control_enabled=excluded.demand_control_enabled,
         pcm_pid_enabled=excluded.pcm_pid_enabled,
         bat_pid_enabled=excluded.bat_pid_enabled,
         pid_kp=excluded.pid_kp,
         pid_kd=excluded.pid_kd,
         updated_at=now()
      `,
      [
        pid,
        Number(body?.pcmCapacityKWh ?? 0),
        Number(body?.lifepo4CapacityKWh ?? 0),
        toBool(body?.hasPV, true),
        Number(body?.pvAcPeakPower ?? 0),
        Number(body?.pvDcPeakPower ?? 0),
        gridFeedMode,
        Number(body?.maxFeedPower ?? 0),
        alwaysExportEnabled,
        Number(body?.alwaysExportPower ?? 150),
        alwaysImportEnabled,
        Number(body?.alwaysImportPower ?? 150),
        String(body?.emsMode ?? "AUTO"),
        Number(body?.maxGridPowerKw ?? 0),
        Number(body?.maxGenPowerKw ?? 0),
        Number(body?.demandLimitKw ?? 0),
        toBool(body?.demandControlEnabled, true),

        // PID
        toBool(body?.pcmPidEnabled, false),
        toBool(body?.batPidEnabled, false),
        pidNum(body?.pidKp, 1.0),
        pidNum(body?.pidKd, 0.0),
      ]
    );

    // 4) Kaydedilmiş son halini döndür (DB kaynaklı)
    const p = await pool.query(`select name, address from plants where id=$1`, [
      pid,
    ]);
    const s = await pool.query(
      `select * from plant_settings where plant_id=$1 limit 1`,
      [pid]
    );

    return NextResponse.json({
      ok: true,
      settings: {
        plantName: p.rows[0]?.name ?? plantName,
        plantAddress: p.rows[0]?.address ?? plantAddress,
        pcmCapacityKWh: Number(s.rows[0]?.pcm_capacity_kwh ?? 0),
        lifepo4CapacityKWh: Number(s.rows[0]?.lifepo4_capacity_kwh ?? 0),
        hasPV: Boolean(s.rows[0]?.has_pv),
        pvAcPeakPower: Number(s.rows[0]?.pv_ac_peak_power ?? 0),
        pvDcPeakPower: Number(s.rows[0]?.pv_dc_peak_power ?? 0),
        gridFeedMode: (s.rows[0]?.grid_feed_mode ??
          "self-consume") as GridFeedMode,
        maxFeedPower: Number(s.rows[0]?.max_feed_power ?? 0),
        alwaysExportEnabled: Boolean(s.rows[0]?.always_export_enabled),
        alwaysExportPower: Number(s.rows[0]?.always_export_power ?? 150),
        alwaysImportEnabled: Boolean(s.rows[0]?.always_import_enabled),
        alwaysImportPower: Number(s.rows[0]?.always_import_power ?? 150),
        emsMode: (s.rows[0]?.ems_mode ?? "AUTO") as EmsMode,
        maxGridPowerKw: Number(s.rows[0]?.max_grid_power_kw ?? 0),
        maxGenPowerKw: Number(s.rows[0]?.max_gen_power_kw ?? 0),
        demandLimitKw: Number(s.rows[0]?.demand_limit_kw ?? 0),
        demandControlEnabled: Boolean(s.rows[0]?.demand_control_enabled),

        pcmPidEnabled: Boolean(s.rows[0]?.pcm_pid_enabled),
        batPidEnabled: Boolean(s.rows[0]?.bat_pid_enabled),
        pidKp: Number(s.rows[0]?.pid_kp ?? 1.0),
        pidKd: Number(s.rows[0]?.pid_kd ?? 0.0),

        updatedAt: s.rows[0]?.updated_at
          ? new Date(s.rows[0].updated_at).toISOString()
          : new Date().toISOString(),
      },
    });
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
