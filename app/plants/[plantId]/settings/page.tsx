// app/plants/[plantId]/settings/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PlantSettings from "@/components/PlantSettings";
import PlantDeleteButton from "@/components/PlantDeleteButton";

// Bu sayfada sadece name lazım; type zorlamayalım (Plant tipi location vs bekleyebilir)
type PlantInfo = { id: number; name?: string | null };

type RouteCtx = { params: Promise<{ plantId: string }> };

function parsePlantId(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchPlantInfo(plantId: number): Promise<PlantInfo | null> {
  const h = await headers();

  // Vercel/proxy için absolute URL
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) return null;

  // ⚠️ Telemetry endpoint'i ile çakışmamak için /info kullanıyoruz
  const url = `${proto}://${host}/api/plants/${plantId}/info`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  return {
    id: Number(data?.id ?? plantId),
    name: typeof data?.name === "string" ? data.name : null,
  };
}

export default async function PlantSettingsPage({ params }: RouteCtx) {
  const resolved = await params;
  const plantId = parsePlantId(resolved?.plantId);

  if (!plantId) notFound();

  const info = await fetchPlantInfo(plantId);

  return (
    <main className="min-h-screen px-4 py-8 lg:px-10 lg:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Üst Bar */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Tesis Ayarları</h1>
            <p className="text-xs text-slate-400">
              Tesis ID: <span className="font-mono">{plantId}</span>
              {info?.name ? (
                <>
                  {" "}
                  • <span className="text-slate-200">{info.name}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/plants/${plantId}`}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
            >
              ← Geri
            </Link>

            <PlantDeleteButton
              plantId={plantId}
              plantName={info?.name ?? `Tesis ${plantId}`}
            />
          </div>
        </div>

        {/* Settings form */}
        <PlantSettings plantId={plantId} initialName={info?.name ?? undefined} />
      </div>
    </main>
  );
}
