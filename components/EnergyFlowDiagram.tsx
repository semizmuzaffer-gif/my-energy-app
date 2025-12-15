"use client";

type LiveLike = {
  p_total: number;
  p_l1: number;
  p_l2: number;
  p_l3: number;
  pcm_soc: number;
  bat_soc: number;
  mode: string;
  pv_enabled?: boolean; // ✅ inverter/PV aktif mi
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function fmtW(w: number) {
  const abs = Math.abs(w);
  if (abs >= 1000) return `${(w / 1000).toFixed(2)} kW`;
  return `${Math.round(w)} W`;
}

export default function EnergyFlowDiagram({
  live,
  title = "Enerji Akış Şeması",
}: {
  live: LiveLike | null;
  title?: string;
}) {
  const pTotal = live ? (Number.isFinite(live.p_total) ? live.p_total : 0) : 0;
  const sumPhases = live ? (live.p_l1 ?? 0) + (live.p_l2 ?? 0) + (live.p_l3 ?? 0) : 0;

  // ✅ senin kesin bilgin: + = şebekeden çekiş
  const gridImportW = Math.max(0, Math.abs(pTotal) > 1 ? pTotal : sumPhases);
  const isImport = gridImportW > 20;

	const inverterEnabled =  live?.pv_enabled === true || live?.mode === "AUTO" ||  live?.mode === "PV_FIRST";             // geçici fallback

	
  // ✅ Minimum gerçekçi: Şebeke→İnverter→DiğerYükler
  const wOther = isImport ? gridImportW : 0;

  // Opsiyonel kollar (halen simülasyon; göstergeler çok düşük opaklıkla)
  const batNeed = live ? clamp((90 - live.bat_soc) / 90, 0, 1) : 0;
  const pcmNeed = live ? clamp((95 - live.pcm_soc) / 95, 0, 1) : 0;

  const wBat = isImport ? clamp(gridImportW * (0.05 + 0.18 * batNeed), 0, gridImportW) : 0;
  const wChiller = isImport ? clamp(gridImportW * (0.05 + 0.20 * pcmNeed), 0, gridImportW) : 0;
  const wPcm = wChiller * 0.75;

  const activeGridToInv = isImport;
  const activeInvToOther = isImport && wOther > 10;
  const activeGridToOther = isImport && wOther > 10; // ✅ ek bağlantı
  const inverterPathEnabled = isImport; // ileride inverter_enabled alanıyla değiştiririz
	const activeGridToOtherViaInverter = inverterPathEnabled && wOther > 0;
  const activeInvToBat = isImport && wBat > 120;
  const activeInvToChiller = isImport && wChiller > 180;
  const activeChillerToPcm = isImport && wPcm > 180;
  
   const activeGridToChiller = isImport && (wChiller > 80 || wOther > 20);
 {/* const activeGridToChiller = isImport && (live?.chiller_w ?? 0) > 50;*/}

  // Normalize for visual intensity
  const intensity = clamp(gridImportW / 4000, 0.2, 1);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/40 overflow-hidden">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-3">
        <div>
          <div className="text-xs text-slate-300">{title}</div>
          <div className="text-sm font-semibold text-slate-50">
            {isImport ? "IMPORT · Şebekeden Yük Besleme" : "Bekleme / Veri Yok"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] text-slate-200">
          <span className="rounded-full bg-black/30 border border-white/10 px-3 py-1">L1 {live ? fmtW(live.p_l1) : "—"}</span>
          <span className="rounded-full bg-black/30 border border-white/10 px-3 py-1">L2 {live ? fmtW(live.p_l2) : "—"}</span>
          <span className="rounded-full bg-black/30 border border-white/10 px-3 py-1">L3 {live ? fmtW(live.p_l3) : "—"}</span>
          <span className="rounded-full bg-black/30 border border-white/10 px-3 py-1">Toplam {live ? fmtW(pTotal) : "—"}</span>
        </div>
      </div>

      {/* ✅ Yanlardan küçült: max genişliği içerde sınırla */}
      <div className="rounded-2xl border border-white/10 p-3 relative overflow-hidden">
        {/* Aydınlık neon arka plan (daha açık) */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute -top-28 -left-28 h-80 w-80 rounded-full blur-3xl"
            style={{ background: `rgba(16,255,180,${0.18 * intensity})` }}
          />
          <div
            className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full blur-3xl"
            style={{ background: `rgba(34,211,238,${0.18 * intensity})` }}
          />
          <div className="absolute inset-0 bg-black/25" />
        </div>

        <div className="mx-auto max-w-4xl">
          {/* ✅ viewBox daraltıldı: daha kompakt görünüm */}
          <svg viewBox="0 0 820 320" className="w-full h-[280px]">
            <defs>
              <linearGradient id="neonG" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="rgba(16,255,180,0.05)" />
                <stop offset="0.5" stopColor="rgba(16,255,180,1.00)" />
                <stop offset="1" stopColor="rgba(16,255,180,0.05)" />
              </linearGradient>

              <linearGradient id="neonC" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="rgba(34,211,238,0.05)" />
                <stop offset="0.5" stopColor="rgba(34,211,238,0.95)" />
                <stop offset="1" stopColor="rgba(34,211,238,0.05)" />
              </linearGradient>

              <linearGradient id="nodeFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
              </linearGradient>

              <filter id="glow">
                <feGaussianBlur stdDeviation="4.0" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* ✅ Küçültülmüş Ok marker */}
				<marker
							id="arrowG"
							markerWidth="6"
							markerHeight="6"
							refX="5.5"
							refY="3"
							orient="auto"
							>
							<path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(16,255,180,0.95)" />
								</marker>

							<marker
									id="arrowC"
									markerWidth="6"
									markerHeight="6"
									refX="5.5"
									refY="3"
									orient="auto"
									>
									<path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(34,211,238,0.9)" />
							</marker>
							<marker
									id="arrowK"
									markerWidth="6"
									markerHeight="6"
									refX="5.5"
									refY="3"
									orient="auto"
									>
									<path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(34,150,38,0.9)" />
							</marker>

              <style>{`
                .flow {
                  stroke-dasharray: 10 12;
                  animation: dash 0.95s linear infinite;
                }
                @keyframes dash { to { stroke-dashoffset: -22; } }

                .node {
                  fill: url(#nodeFill);
                  stroke: rgba(255,255,255,0.22);
                }
                .nodeTitle { fill: rgba(226,232,240,0.96); font-weight: 900; }
                .nodeSub { fill: rgba(148,163,184,0.9); }
              `}</style>
            </defs>

            {/* LINKS */}
			{/* 1) Şebeke -> İnverter */}
            
<path
  d="M 150 160 C 240 160, 290 160, 340 160"
  stroke="url(#neonG)"
  strokeWidth={activeGridToInv ? 7 : 3}
  opacity={activeGridToInv ? 0.95 : 0.18}
  className={activeGridToInv ? "flow" : ""}
  filter={activeGridToInv ? "url(#glow)" : undefined}
  markerEnd={activeGridToInv ? "url(#arrowG)" : undefined}
  fill="none"
/>

{/* 2) İnverter -> Diğer Yükler */}
 
<path
  d="M 480 160 C 560 160, 610 160, 670 160"
  stroke="url(#neonG)"
  strokeWidth={activeInvToOther ? 7 : 3}
  opacity={activeInvToOther ? 0.95 : 0.14}
  className={activeInvToOther ? "flow" : ""}
  filter={activeInvToOther ? "url(#glow)" : undefined}
  markerEnd={activeInvToOther ? "url(#arrowG)" : undefined}
  fill="none"
/>

 {/* 3) Şebeke -> Diğer Yükler (direkt üst yay) */}

<path
  d="M 150 160 C 290 55, 530 55, 670 160"
  stroke="url(#neonG)"
  strokeWidth={activeGridToOther ? 4 : 2}
  opacity={activeGridToOther ? 0.65 : 0.08}
  className={activeGridToOther ? "flow" : ""}
  markerEnd={activeGridToOther ? "url(#arrowK)" : undefined}
  fill="none"
/>

 {/* 4) Şebeke -> (İnverter içinden) -> Diğer Yükler (inverter içinden geçen yay)
// sadece inverterEnabled + import iken yanmalı */}
 
<path
  d="M 150 160
     C 285 95, 360 95, 410 160
     S 600 225, 670 160"
  stroke="url(#neonC)"
  strokeWidth={activeGridToOtherViaInverter ? 4 : 2}
  opacity={activeGridToOtherViaInverter ? 0.65 : 0.08}
  className={activeGridToOtherViaInverter ? "flow" : ""}
  filter={activeGridToOtherViaInverter ? "url(#glow)" : undefined}
  markerEnd={activeGridToOtherViaInverter ? "url(#arrowC)" : undefined}
  fill="none"
/>

 {/* İnverter -> LiFePO₄ (üst yay) */}

{/* İnverter -> LiFePO₄ (sağdan dolanan yay) */}
<path
  d="M 480 140
     C 540 110, 545 70, 485 48"
  stroke="url(#neonC)"
  strokeWidth={activeInvToBat ? 5 : 2.5}
  opacity={activeInvToBat ? 0.55 : 0.10}
  className={activeInvToBat ? "flow" : ""}
  markerEnd={activeInvToBat ? "url(#arrowC)" : undefined}
  fill="none"
/>

{/* // 6) İnverter -> Dış Ünite (alta sol yay) */}

<path
  d="M 360 192 C 300 230, 240 255, 260 276"
  stroke="url(#neonC)"
  strokeWidth={activeInvToChiller ? 4 : 2}
  opacity={activeInvToChiller ? 0.4 : 0.10}
  className={activeInvToChiller ? "flow" : ""}
  markerEnd={activeInvToChiller ? "url(#arrowG)" : undefined}
  fill="none"
/>

{/* 7) Dış Ünite -> PCM (alta sağ yay)*/}
<path
  d="M 260 276 C 350 310, 450 310, 530 276"
  stroke="url(#neonC)"
  strokeWidth={activeChillerToPcm ? 5 : 2.5}
  opacity={activeChillerToPcm ? 0.55 : 0.10}
  className={activeChillerToPcm ? "flow" : ""}
  markerEnd={activeChillerToPcm ? "url(#arrowC)" : undefined}
  fill="none"
/>

{/* // ✅ 8) YENİ: Şebeke -> Dış Ünite (direkt yay*/}
)
<path
  d="M 85 188 C 85 230, 110 255, 165 248"
  stroke="url(#neonC)"
  strokeWidth={activeGridToChiller ? 4 : 2}
  opacity={activeGridToChiller ? 0.40 : 0.08}
  className={activeGridToChiller ? "flow" : ""}
  markerEnd={activeGridToChiller ? "url(#arrowC)" : undefined}
  fill="none"
/>

            {/* NODES */}
            {/* Grid */}
            <g>
              <rect x="20" y="132" width="130" height="56" rx="18" className="node" />
              <text x="85" y="158" textAnchor="middle" fontSize="13" className="nodeTitle">
                Şebeke
              </text>
              <text x="85" y="178" textAnchor="middle" fontSize="10" className="nodeSub">
                {isImport ? "IMPORT" : "IDLE"}
              </text>
            </g>

            {/* Inverter center */}
            <g>
              <rect x="340" y="128" width="140" height="64" rx="24" className="node" />
              <text x="412" y="156" textAnchor="middle" fontSize="14" className="nodeTitle">
                İnverter
              </text>
              <text x="412" y="178" textAnchor="middle" fontSize="10" className="nodeSub">
                PV Üretimi
              </text>
            </g>

            {/* Other loads */}
            <g>
              <rect x="670" y="132" width="130" height="56" rx="18" className="node" />
              <text x="735" y="158" textAnchor="middle" fontSize="13" className="nodeTitle">
                Diğer Yükler
              </text>
              <text x="735" y="178" textAnchor="middle" fontSize="10" className="nodeSub">
                Aktif tüketim
              </text>
            </g>

            {/* LiFePO4 */}
            <g>
              <rect x="319" y="4" width="180" height="56" rx="18" className="node" />
              <text x="412" y="30" textAnchor="middle" fontSize="13" className="nodeTitle">
                LiFePO₄
              </text>
              <text x="412" y="50" textAnchor="middle" fontSize="10" className="nodeSub">
                SOC {live ? `${Math.round(live.bat_soc)}%` : "—"}
              </text>
            </g>

            {/* Chiller */}
            <g>
              <rect x="70" y="248" width="190" height="56" rx="18" className="node" />
              <text x="165" y="274" textAnchor="middle" fontSize="13" className="nodeTitle">
                Dış Ünite
              </text>
              <text x="165" y="294" textAnchor="middle" fontSize="10" className="nodeSub">
                Chiller 
              </text>
            </g>

            {/* PCM */}
            <g>
              <rect x="530" y="248" width="190" height="56" rx="18" className="node" />
              <text x="625" y="274" textAnchor="middle" fontSize="13" className="nodeTitle">
                PCM Battery
              </text>
              <text x="625" y="294" textAnchor="middle" fontSize="10" className="nodeSub">
                SOC {live ? `${Math.round(live.pcm_soc)}%` : "—"}
              </text>
            </g>
          </svg>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-slate-300">
        Şu an kesin olarak gösterilen yön:{" "}
        <span className="text-slate-100 font-semibold">Şebeke → İnverter → Diğer Yükler</span>. Oklar akış yönünü belirtir.
      </div>
    </div>
  );
}
