// components/PlantEnergyGraph.tsx
"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

export type TelemetryHistoryPoint = {
  time: string;

  // Power (kW)
  p_total_kw: number;
  p_l1_kw: number;
  p_l2_kw: number;
  p_l3_kw: number;

  // Voltage (V)
  v_l1: number;
  v_l2: number;
  v_l3: number;

  // Current (A)
  i_l1: number;
  i_l2: number;
  i_l3: number;

  // SOC (%)
  pcm_soc: number;
  bat_soc: number;
};

const neon = {
  total: "#10ffb4", // neon green
  l1: "#22d3ee",
  l2: "#a78bfa",
  l3: "#fb7185",
  v1: "#38bdf8",
  v2: "#fbbf24",
  v3: "#34d399",
  i1: "#60a5fa",
  i2: "#f472b6",
  i3: "#f97316",
  pcm: "#34d399",
  bat: "#10ffb4",
};

type Tab = "power" | "voltage" | "current" | "soc";

export default function PlantEnergyGraph({
  history,
}: {
  history: TelemetryHistoryPoint[];
}) {
  const [tab, setTab] = useState<Tab>("power");

  const title = useMemo(() => {
    switch (tab) {
      case "power":
        return "Güç (kW)";
      case "voltage":
        return "Gerilim (V)";
      case "current":
        return "Akım (A)";
      case "soc":
        return "SOC (%)";
    }
  }, [tab]);

  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 p-4 shadow-lg shadow-black/40">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
        <div>
          <div className="text-xs text-slate-300">Grafikler</div>
          <div className="text-sm font-semibold">{title}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["power", "Güç"],
            ["voltage", "Gerilim"],
            ["current", "Akım"],
            ["soc", "SOC"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k as Tab)}
              className={`rounded-full px-3 py-1 text-[11px] border transition ${
                tab === k
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                  : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          {tab === "power" ? (
            <AreaChart data={history} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis width={55} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(1)}`} />
              <Tooltip
                contentStyle={{
                  background: "#020617ee",
                  border: "1px solid rgba(16,255,180,0.45)",
                  borderRadius: 12,
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="p_total_kw" name="Toplam" stroke={neon.total} fill={neon.total} fillOpacity={0.10} strokeWidth={2.5} />
              <Area type="monotone" dataKey="p_l1_kw" name="L1" stroke={neon.l1} fill={neon.l1} fillOpacity={0.08} strokeWidth={1.8} />
              <Area type="monotone" dataKey="p_l2_kw" name="L2" stroke={neon.l2} fill={neon.l2} fillOpacity={0.08} strokeWidth={1.8} />
              <Area type="monotone" dataKey="p_l3_kw" name="L3" stroke={neon.l3} fill={neon.l3} fillOpacity={0.08} strokeWidth={1.8} />
            </AreaChart>
          ) : tab === "voltage" ? (
            <LineChart data={history} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis width={55} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#020617ee", border: "1px solid #38bdf8", borderRadius: 12, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="v_l1" name="V_L1" stroke={neon.v1} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="v_l2" name="V_L2" stroke={neon.v2} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="v_l3" name="V_L3" stroke={neon.v3} strokeWidth={2} dot={false} />
            </LineChart>
          ) : tab === "current" ? (
            <LineChart data={history} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis width={55} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#020617ee", border: "1px solid #a78bfa", borderRadius: 12, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="i_l1" name="I_L1" stroke={neon.i1} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="i_l2" name="I_L2" stroke={neon.i2} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="i_l3" name="I_L3" stroke={neon.i3} strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <LineChart data={history} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis width={55} tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#020617ee", border: "1px solid rgba(16,255,180,0.45)", borderRadius: 12, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="pcm_soc" name="PCM SOC" stroke={neon.pcm} strokeWidth={2.2} dot={false} />
              <Line type="monotone" dataKey="bat_soc" name="LiFePO₄ SOC" stroke={neon.bat} strokeWidth={2.2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
