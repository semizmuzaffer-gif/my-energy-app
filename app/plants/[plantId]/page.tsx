// app/plants/[plantId]/page.tsx

import Link from "next/link";
import PlantDashboard from "@/components/PlantDashboard";
import type { Plant } from "@/lib/types";

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
}

async function fetchPlant(plantId: number): Promise<Plant | null> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/plants`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.warn("Failed to fetch plants:", res.status);
    return null;
  }

  const list: Plant[] = await res.json();
  return list.find((p) => p.id === plantId) ?? null;
}

interface Props {
  params: Promise<{ plantId: string }>;
}

export default async function PlantPage({ params }: Props) {
  const { plantId } = await params;
  const numericId = Number(plantId);

  const plant = await fetchPlant(numericId);

  if (!plant) {
    return (
      <main className="min-h-screen px-4 py-6 lg:px-10 lg:py-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-center shadow-lg">
            <h1 className="text-xl font-semibold mb-2">Tesis bulunamadı</h1>
            <p className="text-sm text-slate-300">
              ID: <code className="font-mono">{plantId}</code>
            </p>
            <div className="mt-4">
              <Link href="/">
                <button className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-white/10 transition">
                  ← Tesisler Sayfasına Dön
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Telemetry fetch – senin önceki yapını koruyorum
  let telemetry: any = null;
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/plants/${numericId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      telemetry = await res.json();
    } else {
      console.warn("Telemetry fetch failed:", res.status);
    }
  } catch (err) {
    console.error("Telemetry fetch error:", err);
  }

  return (
    <main className="min-h-screen px-4 py-4 lg:px-10 lg:py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Üst başlık – kompakt */}
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Sol taraf */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Canlı tesis izleme & yönetim
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {plant.name}{" "}
              <span className="text-cyan-300">enerji yönetim paneli</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              Tesis performansını gerçek zamanlı izleyin. Parametre ve EMS
              ayarlarını ayrı sayfadan yönetin.
            </p>

            {/* Tesisler sayfasına dön butonu */}
            <Link href="/" className="inline-block mt-1.5">
              <button className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-3.5 py-1.5 text-[11px] md:text-xs font-medium text-slate-100 hover:bg-white/10 transition">
                ← Tesisler Sayfasına Dön
              </button>
            </Link>
          </div>

          {/* Sağ taraf: özet + Parametre butonu */}
          <div className="w-full max-w-sm flex flex-col gap-2.5">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3.5 shadow-lg shadow-cyan-500/20">
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-cyan-400/20 blur-2xl" />
              <div className="relative space-y-2 text-xs">
                <p className="uppercase tracking-wide text-slate-300 text-[11px]">
                  Tesis Özeti
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-black/40 p-2.5 border border-white/10">
                    <div className="text-[9px] text-slate-400">ID</div>
                    <div className="text-base font-semibold">{numericId}</div>
                    <div className="mt-1 text-[10px] text-cyan-300">
                      sistem kodu
                    </div>
                  </div>
                  <div className="rounded-2xl bg-black/40 p-2.5 border border-white/10">
                    <div className="text-[9px] text-slate-400">Güç</div>
                    <div className="text-base font-semibold">
                      {plant.capacityKw.toFixed(1)} kWp
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-300">
                      kurulu
                    </div>
                  </div>
                  <div className="rounded-2xl bg-black/40 p-2.5 border border-white/10">
                    <div className="text-[9px] text-slate-400">Faz</div>
                    <div className="text-base font-semibold">
                      {plant.phaseType === "three" ? "3F" : "1F"}
                    </div>
                    <div className="mt-1 text-[10px] text-violet-300">
                      faz tipi
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Parametre değişiklikleri için aşağıdaki butonu kullanın.
                </p>
              </div>
            </div>

            <Link href={`/plants/${numericId}/settings`} className="w-full">
              <button className="w-full inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2 text-xs md:text-sm font-medium text-slate-950 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition">
                Tesis Parametre Ayarları
              </button>
            </Link>
          </div>
        </header>

        {/* Dashboard bileşeni */}
        <section>
          <PlantDashboard plant={plant} telemetry={telemetry} />
        </section>
      </div>
    </main>
  );
}
