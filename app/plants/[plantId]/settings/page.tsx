// app/plants/[plantId]/settings/page.tsx

import Link from "next/link";
import PlantSettings from "@/components/PlantSettings";
import { findPlantById } from "@/lib/sampleData";
import PlantDeleteButton from "@/components/PlantDeleteButton";

interface Props {
  // Senin projende params Promise olarak geliyor
  params: Promise<{ plantId: string }>;
}

export default async function PlantSettingsPage({ params }: Props) {
  const { plantId } = await params;
  const numericId = Number(plantId);

  const plant = findPlantById(numericId);

  if (!plant) {
    return (
      <main className="min-h-screen px-4 py-6 lg:px-10 lg:py-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-center shadow-lg">
            <h1 className="text-xl font-semibold mb-2">Tesis bulunamadı</h1>
            <p className="text-sm text-slate-300">
              ID: <code className="font-mono">{plantId}</code>
            </p>
            <div className="mt-4 flex justify-center gap-2">
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

  return (
    <main className="min-h-screen px-4 py-6 lg:px-10 lg:py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Üst başlık */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
              Tesis Parametre Ayarları
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {plant.name}{" "}
              <span className="text-cyan-300">· Parametre Konfigürasyonu</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              EMS çalışma modu, şebeke ve GES kısıtları, Always Export/Import
              gibi kritik parametreleri bu ekrandan yapılandırın. Değişiklikler
              ilgili tesis dongle&apos;ına bağlı EMS modülüne aktarılacaktır.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Link href={`/plants/${numericId}`}>
              <button className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs md:text-sm font-medium text-slate-100 hover:bg-white/15 transition">
                ← Dashboard&apos;a Dön
              </button>
            </Link>
            <Link href="/">
              <button className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-11.5 py-2 text-xs md:text-sm font-medium text-slate-100 hover:bg-white/15 transition">
                ← Tesisler
              </button>
            </Link>

            {/* 🔴 Silme butonu (client component) */}
            <PlantDeleteButton plantId={numericId} />
          </div>
        </header>

        {/* Parametre formu */}
        <PlantSettings plantId={numericId} initialName={plant.name} />
      </div>
    </main>
  );
}
