import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grüntech Solar – Akıllı Enerji Yönetimi",
  description: "Çok tesisli akıllı enerji izleme ve yönetim paneli",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {/* Arka plan: gradient + grid */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#22d3ee22,_transparent_60%),radial-gradient(circle_at_bottom,_#4f46e522,_transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,_#ffffff08_1px,_transparent_1px),linear-gradient(to_bottom,_#ffffff08_1px,_transparent_1px)] bg-[size:80px_80px]" />
        </div>

        {/* Hafif blur overlay */}
        <div className="min-h-screen backdrop-blur-sm">
          {children}
        </div>
      </body>
    </html>
  );
}
