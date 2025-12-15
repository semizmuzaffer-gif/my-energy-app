// components/NewPlantForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PhaseType = "single" | "three";

interface NewPlantFormValues {
  plantId: number;   // Dongle ile aynı ID
  name: string;
  address: string;
  capacityKw: number;
  phaseType: PhaseType;
}

const defaultValues: NewPlantFormValues = {
  plantId: 0,
  name: "",
  address: "",
  capacityKw: 0,
  phaseType: "three",
};

export default function NewPlantForm() {
  const [values, setValues] = useState<NewPlantFormValues>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function updateField<K extends keyof NewPlantFormValues>(
    key: K,
    value: NewPlantFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.plantId || values.plantId <= 0) {
      setError("Tesis ID (Plant ID) zorunludur ve 0'dan büyük olmalıdır.");
      return;
    }
    if (!values.name.trim()) {
      setError("Tesis adı zorunludur.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body?.error ||
            "Tesis kaydedilemedi. Daha sonra tekrar deneyiniz."
        );
        return;
      }

      const data = await res.json();
      // Kaydettikten sonra ilgili tesisin dashboard sayfasına git
      router.push(`/plants/${data.id}`);
    } catch (err) {
      console.error(err);
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 space-y-6"
    >
      {/* Genel bilgiler */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-50">
          Tesis Temel Bilgileri
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Tesis ID (Plant ID)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.plantId || ""}
              onChange={(e) =>
                updateField("plantId", Number(e.target.value) || 0)
              }
            />
            <p className="text-[11px] text-slate-400">
              Dongle üzerinde ayarlayacağınız ID ile bire bir aynı olmalı.
            </p>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-medium text-slate-200">
              Tesis Adı
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ör: GRÜNTECH OFİS TÜKETİM İZLEME"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Adres / Lokasyon
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Ör: Kepez / Antalya"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Kurulu Güç (kWp)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.capacityKw || ""}
              onChange={(e) =>
                updateField("capacityKw", Number(e.target.value) || 0)
              }
              placeholder="Ör: 10"
            />
          </div>
        </div>
      </section>

      {/* Faz tipi */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-50">
          Teknik Özellikler
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Faz Tipi
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <button
                type="button"
                onClick={() => updateField("phaseType", "single")}
                className={`rounded-full px-3 py-1 border ${
                  values.phaseType === "single"
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                    : "border-white/15 bg-black/40"
                }`}
              >
                1 Faz
              </button>
              <button
                type="button"
                onClick={() => updateField("phaseType", "three")}
                className={`rounded-full px-3 py-1 border ${
                  values.phaseType === "three"
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                    : "border-white/15 bg-black/40"
                }`}
              >
                3 Faz
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Detaylı EMS ve enerji parametrelerini daha sonra{" "}
          <span className="font-semibold">Tesis Parametre Ayarları</span> ekranından
          yapılandıracaksınız.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-500/60 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-cyan-500/40 hover:bg-cyan-400 disabled:opacity-60"
        >
          {saving ? "Kaydediliyor…" : "Tesis Oluştur"}
        </button>
      </div>
    </form>
  );
}
