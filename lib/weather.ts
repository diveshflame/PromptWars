import type { DailyForecast, Severity, WeatherData } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT = "MonsoonReady/1.0 (+https://github.com/diveshflame/PromptWars)";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export class WeatherLookupError extends Error {}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    country?: string;
  };
}

// Nominatim's usage policy caps public requests at 1/sec. This serializes
// calls on a shared server instance with a 1s gap between them.
let nominatimQueue: Promise<unknown> = Promise.resolve();

function throttleNominatim<T>(fn: () => Promise<T>): Promise<T> {
  const run = nominatimQueue.then(fn, fn);
  nominatimQueue = run
    .catch(() => undefined)
    .then(() => new Promise((resolve) => setTimeout(resolve, 1000)));
  return run;
}

async function geocodeCity(city: string): Promise<GeocodingResult> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(city)}&format=jsonv2&addressdetails=1&limit=1`;

  const results = await throttleNominatim(async () => {
    const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
    if (!res.ok) {
      throw new WeatherLookupError("Failed to look up location. Please try again.");
    }
    return (await res.json()) as NominatimResult[];
  });

  const result = results[0];
  if (!result) {
    throw new WeatherLookupError(
      `Could not find "${city}". Check the spelling, or try a nearby larger city or town instead.`,
    );
  }

  const address = result.address ?? {};
  const name = address.city || address.town || address.village || address.county || city;
  return {
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    name,
    country: address.country ?? "",
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
    throw new WeatherLookupError("Failed to fetch forecast data. Please try again.");
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
