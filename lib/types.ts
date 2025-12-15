export type PhaseType = "single" | "three";

export type PlantStatus = "online" | "offline" | "partial";

export interface Plant {
  id: number;           // URL’de kullanılacak: /plants/[id]
  name: string;
  location: string;
  capacityKw: number;
  phaseType: PhaseType;
  status: PlantStatus;
  lastUpdate: string;   // ISO string (ileride Date veya number’a çekilebilir)
}
