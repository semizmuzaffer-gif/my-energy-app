// components/PlantDeleteButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlantDeleteButton({ plantId }: { plantId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    const confirmed = confirm(
      `Tesis ID ${plantId} silinecek. Emin misiniz? Bu işlem geri alınamaz.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/plants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId }),
      });

      if (!res.ok) {
        let msg = "Tesis silinemedi.";
        try {
          const data = await res.json();
          if (data?.error) msg = `Tesis silinemedi: ${data.error}`;
        } catch {
          // ignore
        }
        alert(msg);
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
      className="inline-flex items-center rounded-xl border border-red-400/40 bg-red-500/10 px-2 py-1 text-xs md:text-sm font-medium text-red-300 hover:bg-red-	00/20 disabled:opacity-60 transition"
    >
      {loading ? "Siliniyor…" : "🗑️ Tesis Sil"}
    </button>
  );
}
