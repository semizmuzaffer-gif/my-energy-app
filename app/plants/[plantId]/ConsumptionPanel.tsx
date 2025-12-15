// app\plants\[plantId]\ConsumptionPanel.tsx
"use client";
"use client";

import { useEffect, useState } from "react";

type MeterSnapshot = {
  plantId: string;
  meterId: number;
  voltageL1: number;
  currentL1: number;
  totalPower: number;
  totalEnergy: number;
  powerFactor: number;
  lastUpdate: string;
};

interface Props {
  plantId: number;
}

export function ConsumptionPanel({ plantId }: Props) {
  const [data, setData] = useState<MeterSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      // 🔹 Artık /api/plants/[plantId] kullanıyoruz, /telemetry yok
      const res = await fetch(`/api/plants/${plantId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        setData(null);
        setLoading(false);
        return;
      }

      const json = await res.json();
      setData(json.data);
      setLoading(false);
    } catch (err) {
      console.error("Tüketim verisi fetch error", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10_000); // 10 sn'de bir yenile
    return () => clearInterval(id);
  }, [plantId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Tüketim verileri yükleniyor...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">
          Bu plant için henüz ESP32’den tüketim verisi gelmedi.
        </p>
      </div>
    );
  }

  const lastUpdate = new Date(data.lastUpdate);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/80 to-emerald-900/40 p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Anlık Tüketim
          </h2>
          <p className="mt-1 text-xs text-slate-400">Plant ID: {plantId}</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>Son güncelleme:</div>
          <div className="font-mono">
            {lastUpdate.toLocaleTimeString("tr-TR")} –{" "}
            {lastUpdate.toLocaleDateString("tr-TR")}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-black/30 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Anlık Güç
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-emerald-300">
              {data.totalPower.toFixed(2)}
            </span>
            <span className="text-sm text-slate-400">kW</span>
          </div>
        </div>

        <div className="rounded-xl bg-black/30 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Toplam Enerji
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-emerald-300">
              {data.totalEnergy.toFixed(1)}
            </span>
            <span className="text-sm text-slate-400">kWh</span>
          </div>
        </div>

        <div className="rounded-xl bg-black/30 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Faz Gerilimi (L1)
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-emerald-300">
              {data.voltageL1.toFixed(0)}
            </span>
            <span className="text-sm text-slate-400">V</span>
          </div>
        </div>

        <div className="rounded-xl bg-black/30 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Güç Faktörü
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-emerald-300">
              {data.powerFactor.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
