// app/plants/new/page.tsx

import Link from "next/link";
import NewPlantForm from "@/components/NewPlantForm";

export default function NewPlantPage() {
  return (
    <main className="min-h-screen px-4 py-8 lg:px-10 lg:py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
              Yeni Tesis Tanımlama
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Yeni Tesis{" "}
              <span className="text-cyan-300">ekleme ve dongle eşleme</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              Bu ekrandan yeni bir tesisi sisteme ekleyebilir, dongle üzerindeki{" "}
              <span className="font-mono">Plant ID</span> ile eşleştirebilirsiniz.
            </p>
          </div>

          <Link href="/">
            <button className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs md:text-sm font-medium text-slate-100 hover:bg-white/10 transition">
              ← Tesisler Sayfasına Dön
            </button>
          </Link>
        </header>

        <NewPlantForm />
      </div>
    </main>
  );
}
