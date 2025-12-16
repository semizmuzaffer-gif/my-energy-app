"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPlantForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [plantKey, setPlantKey] = useState("");
  const [capacityKw, setCapacityKw] = useState<number>(0);
  const [phaseType, setPhaseType] = useState<"three" | "single">("three");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);

    try {
      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          plantKey: plantKey || null,
          capacityKw,
          phaseType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Plant create failed");

      // yeni tesise yönlendir
      router.push(`/plants/${data.id}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="space-y-1">
        <label className="text-xs text-slate-300">Tesis Adı</label>
        <input
          className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-300">Adres</label>
        <input
          className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Kurulu Güç (kWp)</label>
          <input
            type="number"
            className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
            value={capacityKw}
            onChange={(e) => setCapacityKw(Number(e.target.value))}
            step="0.1"
            min={0}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-300">Faz Tipi</label>
          <select
            className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
            value={phaseType}
            onChange={(e) => setPhaseType(e.target.value === "single" ? "single" : "three")}
          >
            <option value="three">3 Faz</option>
            <option value="single">1 Faz</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-300">Plant Key (opsiyonel)</label>
          <input
            className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono"
            value={plantKey}
            onChange={(e) => setPlantKey(e.target.value)}
            placeholder="ESP/Dongle anahtarı"
          />
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </div>
      )}

      <button
        disabled={saving}
        className="w-full rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
      >
        {saving ? "Kaydediliyor..." : "Tesisi Kaydet"}
      </button>
    </form>
  );
}
