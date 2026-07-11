export type Severity = "low" | "moderate" | "severe" | "extreme";

export interface DailyForecast {
  date: string;
  precipitationSumMm: number;
  windSpeedMaxKmh: number;
  tempMaxC: number;
  tempMinC: number;
  weatherCode: number;
}

export interface WeatherData {
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  currentTempC: number;
  currentPrecipitationMm: number;
  currentWindKmh: number;
  daily: DailyForecast[];
}

export interface ChecklistItem {
  item: string;
  quantity: string;
}

export interface ChecklistBase {
  householdSize: number;
  items: ChecklistItem[];
}

export interface UserInput {
  city: string;
  householdSize: number;
  language: string;
}

export interface PreparednessPlan {
  severity: Severity;
  alert: string | null;
  before: string[];
  during: string[];
  after: string[];
  checklist: ChecklistItem[];
  safetyRecommendations: string[];
  travelAdvisory: string;
}
