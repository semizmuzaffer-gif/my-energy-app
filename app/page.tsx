// app/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { PlantList } from "@/components/PlantList";
import type { Plant } from "@/lib/types";

/* -------------------------------------------------
   Plants (server-side, same app API)
-------------------------------------------------- */
async function fetchPlants(): Promise<Plant[]> {
  const res = await fetch("/api/plants", {
    cache: "no-store",
  });

  if (!res.ok) {
    console.warn("Failed to fetch plants:", res.status);
    return [];
  }

  return res.json();
}

/* -------------------------------------------------
   Page
-------------------------------------------------- */
export default async function HomePage() {
  const plants = await fetchPlants();

  const totalCapacity = plants.reduce(
    (sum, p) => sum + (p.capacityKw ?? 0),
    0
  );

  const threePhaseCount = plants.filter(
    (p) => p.phaseType === "three"
  ).length;

  return (
    <main className="min-h-screen px-4 py-8 lg:px-10 lg:py-10">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Gerçek zamanlı tesis izleme
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Grüntech Solar{" "}
              <span className="text-cyan-300">
                Akıllı Enerji Yönetim Modeli
              </span>
            </h1>

            <p className="max-w-2xl text-sm md:text-base text-slate-300">
              Birden fazla tesis, farklı faz yapıları, hibrit sistemler…
              Hepsini tek bir panelden yönetin.
            </p>
          </div>

          {/* Summary */}
          <div className="w-full max-w-sm flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-cyan-500/20">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl" />

              <div className="relative space-y-3">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Sistem Özeti
                </p>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-2xl bg-black/30 p-3 border border-white/10">
                    <div className="text-[10px] text-slate-400">Tesis</div>
                    <div className="text-lg font-semibold">
                      {plants.length}
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-300">
                      aktif
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3 border border-white/10">
                    <div className="text-[10px] text-slate-400">Toplam kWp</div>
                    <div className="text-lg font-semibold">
                      {totalCapacity.toFixed(1)}
                    </div>
                    <div className="mt-1 text-[11px] text-cyan-300">
                      kurulu güç
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3 border border-white/10">
                    <div className="text-[10px] text-slate-400">3 Faz</div>
                    <div className="text-lg font-semibold">
                      {threePhaseCount}
                    </div>
                    <div className="mt-1 text-[11px] text-violet-300">
                      tesis
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Aşağıdaki listeden bir tesisi seçerek detaylı izleme ekranına
                  geçin.
                </p>
              </div>
            </div>

            <Link href="/plants/new" className="w-full">
              <button className="w-full inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition">
                + Yeni Tesis Ekle
              </button>
            </Link>
          </div>
        </header>

        {/* Plant list */}
        <PlantList plants={plants} />

      </div>
    </main>
  );
}
