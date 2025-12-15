// components/PlantDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import type { Plant } from "@/lib/types";
import EnergyFlowDiagram from "@/components/EnergyFlowDiagram";
import PlantEnergyGraph, { TelemetryHistoryPoint } from "@/components/PlantEnergyGraph";

interface LiveMeasurement {
  p_total: number;
  p_l1: number;
  p_l2: number;
  p_l3: number;

  v_l1: number;
  v_l2: number;
  v_l3: number;

  i_l1: number;
  i_l2: number;
  i_l3: number;

  mode: string;
  pcm_soc: number;
  bat_soc: number;
  timestamp: string;

  meter_ok: number;
}

interface Props {
  plant: Plant;
  telemetry?: any;
}

export default function PlantDashboard({ plant }: Props) {
  const [liveData, setLiveData] = useState<LiveMeasurement | null>(null);
  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = async () => {
    try {
      const res = await fetch(`/api/plants/${plant.id}`, { cache: "no-store" });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Bu tesis için henüz telemetri verisi yok");
        throw new Error(`API hatası: ${res.status}`);
      }

      const json = await res.json();
      const snapshot = json.data ?? json;

      const latest: LiveMeasurement = {
        p_total: snapshot.p_total ?? 0,
        p_l1: snapshot.p_l1 ?? 0,
        p_l2: snapshot.p_l2 ?? 0,
        p_l3: snapshot.p_l3 ?? 0,

        v_l1: snapshot.v_l1 ?? 0,
        v_l2: snapshot.v_l2 ?? 0,
        v_l3: snapshot.v_l3 ?? 0,

        i_l1: snapshot.i_l1 ?? 0,
        i_l2: snapshot.i_l2 ?? 0,
        i_l3: snapshot.i_l3 ?? 0,

        mode: snapshot.mode ?? "UNKNOWN",
        pcm_soc: snapshot.pcm_soc ?? 0,
        bat_soc: snapshot.bat_soc ?? 0,

        timestamp: snapshot.timestamp ? new Date(snapshot.timestamp).toISOString() : new Date().toISOString(),
        meter_ok: snapshot.meter_ok ?? 0,
      };

      setLiveData(latest);
      setError(null);

      const timeLabel = new Date(latest.timestamp).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const next: TelemetryHistoryPoint = {
        time: timeLabel,

        p_total_kw: latest.p_total / 1000,
        p_l1_kw: latest.p_l1 / 1000,
        p_l2_kw: latest.p_l2 / 1000,
        p_l3_kw: latest.p_l3 / 1000,

        v_l1: latest.v_l1,
        v_l2: latest.v_l2,
        v_l3: latest.v_l3,

        i_l1: latest.i_l1,
        i_l2: latest.i_l2,
        i_l3: latest.i_l3,

        pcm_soc: latest.pcm_soc,
        bat_soc: latest.bat_soc,
      };

      setHistory((prev) => {
        const updated = [...prev, next];
        const MAX_POINTS = 90; // ~7.5 dk (5sn)
        return updated.length > MAX_POINTS ? updated.slice(updated.length - MAX_POINTS) : updated;
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Bilinmeyen hata");
      setLiveData(null);
    }
  };

  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant.id]);

  const meterOk = liveData !== null ? (liveData.meter_ok && liveData.meter_ok > 0) : null;

  return (
    <div className="space-y-4">
      {/* Üst bar (yalın) */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] border border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Aktif izleme · {plant.phaseType === "three" ? "3 Faz" : "Monofaze"}
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{plant.name}</h2>
          <p className="text-[11px] md:text-xs text-slate-300">
            {plant.location} · {plant.capacityKw} kWp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          {liveData && (
            <>
              <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">
                Son: {new Date(liveData.timestamp).toLocaleString("tr-TR")}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">
                Mod: {liveData.mode}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 border border-white/10">
                <span className={`h-1.5 w-1.5 rounded-full ${meterOk ? "bg-emerald-400" : "bg-rose-400"}`} />
                Enerji Metre: {meterOk === null ? "Bilinmiyor" : meterOk ? "Bağlı" : "Bağlı değil"}
              </span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-100">
          {error} – ESP32 henüz veri göndermiyor olabilir, bu aşamada normal.
        </div>
      )}

      {/* ✅ 1) Enerji Akış Şeması en üstte */}
      <EnergyFlowDiagram live={liveData} />

      {/* ✅ 2) Grafikler ayrı component */}
      <PlantEnergyGraph history={history} />

      {/* ✅ 3) Detaylar altta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Toplam Güç", value: liveData ? `${(liveData.p_total / 1000).toFixed(3)} kW` : "--" },
          { label: "PCM SOC", value: liveData ? `${Math.round(liveData.pcm_soc)} %` : "--" },
          { label: "LiFePO₄ SOC", value: liveData ? `${Math.round(liveData.bat_soc)} %` : "--" },
          { label: "Mod", value: liveData ? liveData.mode : "--" },
        ].map((c, i) => (
          <div key={i} className="rounded-3xl bg-white/5 border border-white/10 p-3 shadow-sm shadow-black/40">
            <div className="text-[11px] text-slate-300">{c.label}</div>
            <div className="mt-1 text-lg font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["L1", "L2", "L3"] as const).map((ph) => {
          const vKey = `v_${ph.toLowerCase()}` as "v_l1" | "v_l2" | "v_l3";
          const iKey = `i_${ph.toLowerCase()}` as "i_l1" | "i_l2" | "i_l3";
          const pKey = `p_${ph.toLowerCase()}` as "p_l1" | "p_l2" | "p_l3";

          const v = liveData ? liveData[vKey] : 0;
          const a = liveData ? liveData[iKey] : 0;
          const kw = liveData ? liveData[pKey] / 1000 : 0;

          return (
            <div key={ph} className="rounded-3xl bg-white/5 border border-white/10 p-3 shadow-sm shadow-black/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300">Faz {ph}</span>
                <span className="text-[10px] text-slate-400">V · A · kW</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gerilim</span>
                  <span className="font-mono">{liveData ? v.toFixed(1) : "--"} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Akım</span>
                  <span className="font-mono">{liveData ? a.toFixed(2) : "--"} A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Güç</span>
                  <span className="font-mono">{liveData ? kw.toFixed(3) : "--"} kW</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
