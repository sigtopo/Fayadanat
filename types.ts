
export enum DamageLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Report {
  id: string;
  villageName: string;
  province: string;
  commune: string;
  damageType: string;
  damageLevel: DamageLevel;
  needs: string;
  contactNumber: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  mapsLink?: string;
}

export interface AIAnalysisResponse {
  summary: string;
  priorities: string[];
  recommendations: string;
}
