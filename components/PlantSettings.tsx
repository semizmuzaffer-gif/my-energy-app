// components/PlantSettings.tsx
"use client";

import { useEffect, useState } from "react";

type GridFeedMode = "export" | "self-consume" | "no-export";
type EmsMode = "AUTO" | "PV_FIRST" | "GRID_FIRST" | "MANUAL";

interface PlantSettingsValues {
  plantName: string;
  plantAddress: string;
  pcmCapacityKWh: number;
  lifepo4CapacityKWh: number;
  hasPV: boolean;
  pvAcPeakPower: number;
  pvDcPeakPower: number;
  gridFeedMode: GridFeedMode;
  maxFeedPower: number;
  alwaysExportEnabled: boolean;
  alwaysExportPower: number;
  alwaysImportEnabled: boolean;
  alwaysImportPower: number;
  emsMode: EmsMode;
  maxGridPowerKw: number;
  maxGenPowerKw: number;
  demandLimitKw: number;
  demandControlEnabled: boolean;
}

const baseDefaultSettings: PlantSettingsValues = {
  plantName: "",
  plantAddress: "",
  pcmCapacityKWh: 0,
  lifepo4CapacityKWh: 0,
  hasPV: true,
  pvAcPeakPower: 0,
  pvDcPeakPower: 0,
  gridFeedMode: "self-consume",
  maxFeedPower: 0,
  alwaysExportEnabled: false,
  alwaysExportPower: 150,
  alwaysImportEnabled: false,
  alwaysImportPower: 150,
  emsMode: "AUTO",
  maxGridPowerKw: 0,
  maxGenPowerKw: 0,
  demandLimitKw: 0,
  demandControlEnabled: true,
};

interface Props {
  plantId: number;
  initialName?: string; // 🔴 yeni prop
}

export default function PlantSettings({ plantId, initialName }: Props) {
  // İlk state'i oluştururken initialName'i kullanıyoruz
  const [values, setValues] = useState<PlantSettingsValues>(() => ({
    ...baseDefaultSettings,
    plantName: initialName ?? "",
  }));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof PlantSettingsValues>(
    key: K,
    value: PlantSettingsValues[K]
  ) {
    setValues((prev) => {
      let next: PlantSettingsValues = { ...prev, [key]: value };

      if (key === "alwaysExportEnabled" && value === true) {
        next.gridFeedMode = "export";
        next.alwaysImportEnabled = false;
      }
      if (key === "alwaysImportEnabled" && value === true) {
        next.alwaysExportEnabled = false;
      }
      if (key === "gridFeedMode") {
        if (value === "self-consume" || value === "no-export") {
          next.alwaysExportEnabled = false;
        }
      }

      return next;
    });
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/plants/${plantId}/settings`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setValues((prev) => ({
            ...prev,
            ...data,
            // Backend'den plantName boş geliyorsa, karttan gelen ismi koru
            plantName:
              data.plantName && data.plantName.trim() !== ""
                ? data.plantName
                : prev.plantName,
          }));
        }
      } catch (err) {
        console.warn("Settings fetch failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [plantId]);

  // --- Kaydet / ESP'ye gönderilecek config'i backend'e yaz ---

  async function handleSave() {
    try {
      setSaving(true);

      const res = await fetch(`/api/plants/${plantId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        console.error("Save failed", res.status);
        if (typeof window !== "undefined") {
          window.alert(
            "Ayarlar kaydedilemedi (HTTP " + res.status + ")."
          );
        }
        return;
      }

      if (typeof window !== "undefined") {
        window.alert("Ayarlar kaydedildi.");
      }
    } catch (err) {
      console.error(err);
      if (typeof window !== "undefined") {
        window.alert("Ayarlar kaydedilirken bir hata oluştu.");
      }
    } finally {
      setSaving(false);
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 px-6 py-6">
        <p className="text-sm text-slate-200">Tesis parametreleri yükleniyor…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* 1. GENEL PARAMETRELER */}
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              Genel Parametreler
            </h2>
            <p className="text-xs text-slate-300">
              Tesis adı, adresi ve depolama kapasite bilgileri.
            </p>
          </div>
          <span className="text-[11px] text-slate-400">
            Tesis ID: <span className="font-mono">{plantId}</span>
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Tesis Adı
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.plantName}
              onChange={(e) => updateField("plantName", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Tesis Adresi
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.plantAddress}
              onChange={(e) => updateField("plantAddress", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              PCM Kapasitesi (kWh)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.pcmCapacityKWh}
              onChange={(e) =>
                updateField("pcmCapacityKWh", Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              LiFePO₄ Kapasitesi (kWh)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.lifepo4CapacityKWh}
              onChange={(e) =>
                updateField("lifepo4CapacityKWh", Number(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </div>

      {/* 2. GES & ŞEBEKE PARAMETRELERİ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-50">
          GES ve Şebeke Parametreleri
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {/* GES var mı */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Mevcutta GES Var mı?
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <button
                type="button"
                onClick={() => updateField("hasPV", true)}
                className={`rounded-full px-3 py-1 border text-xs ${
                  values.hasPV
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                    : "border-white/15 bg-black/40 text-slate-200"
                }`}
              >
                Evet
              </button>
              <button
                type="button"
                onClick={() => updateField("hasPV", false)}
                className={`rounded-full px-3 py-1 border text-xs ${
                  !values.hasPV
                    ? "border-rose-400 bg-rose-500/20 text-rose-100"
                    : "border-white/15 bg-black/40 text-slate-200"
                }`}
              >
                Hayır
              </button>
            </div>
          </div>

          {/* GES AC */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              GES AC Pik Gücü (kW)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.pvAcPeakPower}
              onChange={(e) =>
                updateField("pvAcPeakPower", Number(e.target.value) || 0)
              }
            />
          </div>

          {/* GES DC */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              GES DC Pik Gücü (kW)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.pvDcPeakPower}
              onChange={(e) =>
                updateField("pvDcPeakPower", Number(e.target.value) || 0)
              }
            />
          </div>
        </div>

        {/* Şebeke / feed-in */}
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Şebekeye Veriş Modu
            </label>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.gridFeedMode}
              onChange={(e) =>
                updateField("gridFeedMode", e.target.value as GridFeedMode)
              }
              disabled={values.alwaysExportEnabled}
            >
              <option value="export">Veriş + Tüketim (Projeli GES)</option>
              <option value="self-consume">Öztüketim (veriş yok)</option>
              <option value="no-import">Sadece Veriş (Çekiş kapalı)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Always Export aktif olduğunda bu alan otomatik{" "}
              <span className="font-semibold">Veriş</span> moduna çekilir.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Max Feed-in Gücü (W)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.maxFeedPower}
              onChange={(e) =>
                updateField("maxFeedPower", Number(e.target.value) || 0)
              }
            />
          </div>
        </div>

        {/* Always Export & Always Import */}
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          {/* Always Export */}
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-100">
                  Always Export to Grid
                </p>
                <p className="text-[11px] text-slate-400">
                  Seçili ise bu tesis <strong>yalnızca şebekeye veriş</strong>{" "}
                  yapabilir, şebekeden tüketim yapamaz. EMS her zaman aşağıdaki
                  güçte veriş hedefler.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField("alwaysExportEnabled", !values.alwaysExportEnabled)
                }
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                  values.alwaysExportEnabled
                    ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/60"
                    : "bg-slate-700/40 text-slate-200 border border-slate-500/60"
                }`}
              >
                <span
                  className={`mr-2 inline-block h-2 w-2 rounded-full ${
                    values.alwaysExportEnabled ? "bg-emerald-400" : "bg-slate-400"
                  }`}
                />
                {values.alwaysExportEnabled ? "Aktif" : "Pasif"}
              </button>
            </div>

            <div className="space-y-1 mt-2">
              <label className="block text-xs font-medium text-slate-200">
                Hedef Veriş Gücü (W)
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-cyan-400 disabled:opacity-60"
                value={values.alwaysExportPower}
                onChange={(e) =>
                  updateField("alwaysExportPower", Number(e.target.value) || 0)
                }
                disabled={!values.alwaysExportEnabled}
              />
            </div>
          </div>

          {/* Always Import */}
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-100">
                  Always Import From Grid
                </p>
                <p className="text-[11px] text-slate-400">
                  Şebekeye verişe izin verilmediği senaryolarda, PV olsa bile
                  şebekeden her zaman minimum bu güç çekilir.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  !values.alwaysExportEnabled &&
                  updateField(
                    "alwaysImportEnabled",
                    !values.alwaysImportEnabled
                  )
                }
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                  values.alwaysImportEnabled && !values.alwaysExportEnabled
                    ? "bg-amber-500/20 text-amber-100 border border-amber-400/60"
                    : "bg-slate-700/40 text-slate-200 border border-slate-500/60"
                } ${
                  values.alwaysExportEnabled
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }`}
                disabled={values.alwaysExportEnabled}
              >
                <span
                  className={`mr-2 inline-block h-2 w-2 rounded-full ${
                    values.alwaysImportEnabled && !values.alwaysExportEnabled
                      ? "bg-amber-400"
                      : "bg-slate-400"
                  }`}
                />
                {values.alwaysImportEnabled && !values.alwaysExportEnabled
                  ? "Aktif"
                  : "Pasif"}
              </button>
            </div>

            <div className="space-y-1 mt-2">
              <label className="block text-xs font-medium text-slate-200">
                Min. Çekilecek Güç (W)
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-cyan-400 disabled:opacity-60"
                value={values.alwaysImportPower}
                onChange={(e) =>
                  updateField("alwaysImportPower", Number(e.target.value) || 0)
                }
                disabled={
                  !values.alwaysImportEnabled || values.alwaysExportEnabled
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. EMS PARAMETRELERİ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-50">
          EMS Çalışma Parametreleri
        </h2>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1 md:col-span-1">
            <label className="block text-xs font-medium text-slate-200">
              EMS Çalışma Modu
            </label>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.emsMode}
              onChange={(e) =>
                updateField("emsMode", e.target.value as EmsMode)
              }
            >
              <option value="AUTO">Otomatik</option>
              <option value="PV_FIRST">PV Öncelikli</option>
              <option value="GRID_FIRST">Şebeke Öncelikli</option>
              <option value="MANUAL">Manuel</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Şebeke Max Güç (kW)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.maxGridPowerKw}
              onChange={(e) =>
                updateField("maxGridPowerKw", Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Jeneratör Max Güç (kW)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.maxGenPowerKw}
              onChange={(e) =>
                updateField("maxGenPowerKw", Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Pik Talep Limiti (kW)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400"
              value={values.demandLimitKw}
              onChange={(e) =>
                updateField("demandLimitKw", Number(e.target.value) || 0)
              }
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl bg-black/40 px-4 py-3 border border-white/10 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-slate-100">
              Talep Kontrolü Aktif mi?
            </p>
            <p className="text-[11px] text-slate-400 max-w-xl">
              Açık olduğunda EMS, PCM ve kontrol edilebilir yükleri kullanarak
              pik talep limitini aşmamaya çalışır.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateField("demandControlEnabled", !values.demandControlEnabled)
            }
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
              values.demandControlEnabled
                ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/60"
                : "bg-slate-700/40 text-slate-200 border border-slate-500/60"
            }`}
          >
            <span
              className={`mr-2 inline-block h-2 w-2 rounded-full ${
                values.demandControlEnabled ? "bg-emerald-400" : "bg-slate-400"
              }`}
            />
            {values.demandControlEnabled ? "Aktif" : "Pasif"}
          </button>
        </div>
      </div>

      {/* KAYDET */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-cyan-500/40 hover:bg-cyan-400 disabled:opacity-60"
        >
          {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
        </button>
      </div>
    </section>
  );
}
