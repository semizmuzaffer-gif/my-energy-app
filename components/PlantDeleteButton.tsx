// components/PlantDeleteButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlantDeleteButton({ plantId, plantName }: { plantId: number; plantName?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    const confirmed = confirm(
      `${plantName ? `"${plantName}" ` : ""}Tesis (ID: ${plantId}) silinecek. Emin misiniz?\nBu işlem geri alınamaz.`
    );
    if (!confirmed) return;

  const masterPassword = (prompt("Master şifreyi girin:") ?? "").trim();
if (!masterPassword) {
  alert("İşlem iptal edildi.");
  return;
}

    setLoading(true);
    try {
      const res = await fetch("/api/plants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId, masterPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error ? `Tesis silinemedi: ${data.error}` : "Tesis silinemedi.");
        return;
      }

      alert("Tesis başarıyla silindi.");
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs md:text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-60 transition"
    >
      {loading ? "Siliniyor…" : "🗑️ Tesis Sil"}
    </button>
  );
}
