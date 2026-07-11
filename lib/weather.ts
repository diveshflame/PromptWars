import type { DailyForecast, Severity, WeatherData } from "./types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export class WeatherLookupError extends Error {}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

async function geocodeCity(city: string): Promise<GeocodingResult> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new WeatherLookupError("Failed to look up location");
  }
  const data = await res.json();
  const result = data.results?.[0];
  if (!result) {
    throw new WeatherLookupError(`Could not find location "${city}"`);
  }
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    name: result.name,
    country: result.country ?? "",
  };
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const location = await geocodeCity(city);

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,precipitation,wind_speed_10m",
    daily:
      "precipitation_sum,wind_speed_10m_max,weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "7",
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) {
    throw new WeatherLookupError("Failed to fetch forecast data");
  }
  const data = await res.json();

  const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
    date,
    precipitationSumMm: data.daily.precipitation_sum[i],
    windSpeedMaxKmh: data.daily.wind_speed_10m_max[i],
    tempMaxC: data.daily.temperature_2m_max[i],
    tempMinC: data.daily.temperature_2m_min[i],
    weatherCode: data.daily.weather_code[i],
  }));

  return {
    locationName: location.name,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    currentTempC: data.current.temperature_2m,
    currentPrecipitationMm: data.current.precipitation,
    currentWindKmh: data.current.wind_speed_10m,
    daily,
  };
}

/**
 * Severity thresholds follow IMD rainfall categories (mm/day) and standard
 * wind-speed categories (km/h), evaluated over the next 3 forecast days.
 */
export function getSeverity(weather: Pick<WeatherData, "daily">): Severity {
  const horizon = weather.daily.slice(0, 3);
  const maxPrecip = Math.max(0, ...horizon.map((d) => d.precipitationSumMm));
  const maxWind = Math.max(0, ...horizon.map((d) => d.windSpeedMaxKmh));

  if (maxPrecip >= 204.5 || maxWind >= 89) return "extreme";
  if (maxPrecip >= 64.5 || maxWind >= 62) return "severe";
  if (maxPrecip >= 15.6 || maxWind >= 39) return "moderate";
  return "low";
}
