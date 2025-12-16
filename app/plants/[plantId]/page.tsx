import Link from "next/link";
import PlantDashboard from "@/components/PlantDashboard";
import type { Plant } from "@/lib/types";
import { pool } from "@/lib/db";

/* -------------------------------------------------
   API base (Vercel + local uyumlu)
-------------------------------------------------- */
function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE || "";
}

/* -------------------------------------------------
   Plant bilgisi (DB’den)
-------------------------------------------------- */
async function fetchPlant(plantId: number): Promise<Plant | null> {
  const { rows } = await pool.query(
    `select
       id,
       name,
       address,
       timezone,
       is_active,
       capacity_kw,
       phase_type,
       created_at,
       updated_at
     from plants
     where id = $1
     limit 1`,
    [plantId]
  );

  if (rows.length === 0) return null;

  const r: any = rows[0];
  return {
    id: Number(r.id),
    name: r.name,
    location: r.address ?? "",        // senin UI location kullanıyor
    address: r.address ?? "",
    timezone: r.timezone ?? "Europe/Istanbul",
    isActive: Boolean(r.is_active),
    capacityKw: Number(r.capacity_kw ?? 0),
    phaseType: (r.phase_type ?? "three") as "three" | "single",
    status: "offline",                // şimdilik (telemetry gelince güncelleriz)
    lastUpdate: new Date().toISOString(),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  } as any;
}

/* -------------------------------------------------
   Page
-------------------------------------------------- */
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

  /* -------------------------------------------------
     Telemetry (DB’den son kayıt)
  -------------------------------------------------- */
  let telemetry: any = null;
try {
  const { rows } = await pool.query(
    `select *
     from telemetry_readings
     where plant_id = $1
     order by ts desc
     limit 1`,
    [numericId]
  );
  telemetry = rows[0] ?? null;
} catch (e) {
  telemetry = null;
}

  return (
    <main className="min-h-screen px-4 py-4 lg:px-10 lg:py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

            <Link href="/" className="inline-block mt-1.5">
              <button className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/10 transition">
                ← Tesisler Sayfasına Dön
              </button>
            </Link>
          </div>

          <div className="w-full max-w-sm flex flex-col gap-2.5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3.5 shadow-lg">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-black/40 p-2 border border-white/10">
                  <div className="text-[10px] text-slate-400">ID</div>
                  <div className="text-base font-semibold">{numericId}</div>
                </div>
                <div className="rounded-xl bg-black/40 p-2 border border-white/10">
                  <div className="text-[10px] text-slate-400">Güç</div>
                  <div className="text-base font-semibold">
                    {plant.capacityKw.toFixed(1)} kWp
                  </div>
                </div>
                <div className="rounded-xl bg-black/40 p-2 border border-white/10">
                  <div className="text-[10px] text-slate-400">Faz</div>
                  <div className="text-base font-semibold">
                    {plant.phaseType === "three" ? "3F" : "1F"}
                  </div>
                </div>
              </div>
            </div>

            <Link href={`/plants/${numericId}/settings`}>
              <button className="w-full rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 transition">
                Tesis Parametre Ayarları
              </button>
            </Link>
          </div>
        </header>

        <section>
          <PlantDashboard plant={plant} telemetry={telemetry} />
        </section>
      </div>
    </main>
  );
}
