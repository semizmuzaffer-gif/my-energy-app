// components/PlantList.tsx
"use client";

import Link from "next/link";
import type { Plant } from "@/lib/types";

interface Props {
  plants: Plant[];
}

type PlantStatus = "online" | "offline" | "partial";

const statusLabel: Record<PlantStatus, string> = {
  online: "Online",
  offline: "Offline",
  partial: "Kısmi",
};

const statusDot: Record<PlantStatus, string> = {
  online: "bg-emerald-400",
  offline: "bg-red-400",
  partial: "bg-amber-400",
};

function safeStatus(p: any): PlantStatus {
  const s = p?.status;
  return s === "online" || s === "offline" || s === "partial" ? s : "offline";
}

function safeIso(v: any): string {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function PlantList({ plants }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Kayıtlı Tesisler</h2>
        <span className="text-[11px] text-slate-400">
          Her bir kart, bir WiFi dongle / tesis yapısını temsil eder.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plants.map((plant) => {
          const status = safeStatus(plant);
          const lastUpdateIso = safeIso((plant as any).lastUpdate);
          const cap = safeNum((plant as any).capacityKw, 0);
          const location = String((plant as any).location ?? (plant as any).address ?? "");

          return (
            <Link
              key={plant.id}
              href={`/plants/${plant.id}`}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-md shadow-black/40 transition hover:-translate-y-1 hover:border-cyan-400/70 hover:shadow-cyan-500/30"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity bg-[radial-gradient(circle_at_top,_#22d3ee,_transparent_60%)]" />

              <div className="relative flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50">{plant.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{location}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] text-slate-200 border border-white/10">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[status]} animate-pulse`} />
                      {statusLabel[status]}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(lastUpdateIso).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-2xl bg-black/40 px-2.5 py-2 border border-white/10">
                    <div className="text-[10px] text-slate-400">Kapasite</div>
                    <div className="text-sm font-semibold text-slate-50">
                      {cap.toFixed(1)} <span className="text-[10px] text-slate-400">kWp</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/40 px-2.5 py-2 border border-white/10">
                    <div className="text-[10px] text-slate-400">Faz Türü</div>
                    <div className="text-sm font-semibold text-slate-50">
                      {(plant as any).phaseType === "three" ? "3 Faz" : "Monofaze"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/40 px-2.5 py-2 border border-white/10">
                    <div className="text-[10px] text-slate-400">Profil</div>
                    <div className="text-sm font-semibold text-slate-50">
                      {cap > 20 ? "Endüstriyel" : "Konut"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-cyan-300" />
                    Anlık güç, tüketim ve enerji akışını görüntüle
                  </span>
                  <span className="text-cyan-300 group-hover:translate-x-0.5 transition-transform">
                    Detaya git →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
