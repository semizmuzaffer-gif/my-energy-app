export type PhaseType = "single" | "three";
export type PlantStatus = "online" | "offline" | "partial";

export interface Plant {
  id: number;
  name: string;
  location: string;
  capacityKw: number;
  phaseType: PhaseType;
  status: PlantStatus;
  lastUpdate: string;
}
