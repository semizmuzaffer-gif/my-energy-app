// lib/sampleData.ts
import type { Plant } from "./types";

// Başlangıç (seed) tesisler – senin verdiğin liste
export const seedPlants: Plant[] = [
  {
    id: 1,
    name: "ÖZGÜR BEY VİLLA",
    location: "Yeşilbayır Mh. Döşemealtı / Antalya",
    capacityKw: 12,
    phaseType: "single",
    status: "online",
    lastUpdate: "2025-11-29T14:30:03+03:00",
  },
  {
    id: 2,
    name: "Ayşegül Karaca GES",
    location: "Düzlerçamı Mh. Ağaçlı",
    capacityKw: 14.5,
    phaseType: "three",
    status: "online",
    lastUpdate: "2025-11-29T14:30:06+03:00",
  },
  {
    id: 3,
    name: "TUFAN FABRİKA",
    location: "Korkuteli",
    capacityKw: 26.4,
    phaseType: "three",
    status: "online",
    lastUpdate: "2025-11-29T14:31:40+03:00",
  },
  {
    id: 4,
    name: "Tülay NURDOĞAN ÇATI",
    location: "Döşemealtı / Antalya",
    capacityKw: 19.22,
    phaseType: "three",
    status: "online",
    lastUpdate: "2025-11-29T15:30:33+03:00",
  },
  {
    id: 5,
    name: "GRÜNTECH OFİS TÜKETİM İZLEME",
    location: "KEPEZ / Antalya",
    capacityKw: 10.0,
    phaseType: "three",
    status: "online",
    lastUpdate: "2025-11-29T15:30:33+03:00",
  },
];

// Runtime’da değişebilen liste
let plants: Plant[] = [...seedPlants];

// Tüm tesisleri oku
export function getPlants(): Plant[] {
  return plants;
}

// ID ile tek tesis bul
export function findPlantById(id: number): Plant | undefined {
  return plants.find((p) => p.id === id);
}

// Yeni tesis ekle / var olanı güncelle (ID unique)
export function upsertPlant(newPlant: Plant): void {
  const idx = plants.findIndex((p) => p.id === newPlant.id);
  if (idx >= 0) {
    plants[idx] = newPlant;
  } else {
    plants.push(newPlant);
  }
}

export function removePlant(id: number): boolean {
  const idx = plants.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  plants.splice(idx, 1);
  return true;
}

// Gerekirse debug için sıfırlama fonksiyonu
export function resetPlants(): void {
  plants = [...seedPlants];
}
