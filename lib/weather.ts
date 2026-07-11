import { createTtlCache } from "./ttlCache";
import type { DailyForecast, Severity, WeatherData } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT = "MonsoonReady/1.0 (+https://github.com/diveshflame/PromptWars)";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export class WeatherLookupError extends Error {}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

export interface NominatimResult {
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

interface OpenMeteoForecastResponse {
  current: {
    temperature_2m: number;
    precipitation: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
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

async function fetchNominatimResults(city: string): Promise<NominatimResult[]> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(city)}&format=jsonv2&addressdetails=1&limit=1`;
  return throttleNominatim(async () => {
    const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
    if (!res.ok) {
      throw new WeatherLookupError("Failed to look up location. Please try again.");
    }
    return (await res.json()) as NominatimResult[];
  });
}

/**
 * Pure selection/fallback logic, kept separate from the network call so it
 * can be unit tested directly with plain arrays — no fetch mocking needed.
 * Prefers the most specific address field Nominatim returns (city > town >
 * village > county), falling back to the user's original query text.
 */
export function selectGeocodingResult(results: NominatimResult[], fallbackCity: string): GeocodingResult | null {
  const result = results[0];
  if (!result) return null;

  const address = result.address ?? {};
  const name = address.city || address.town || address.village || address.county || fallbackCity;
  return {
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    name,
    country: address.country ?? "",
  };
}

async function geocodeCity(city: string): Promise<GeocodingResult> {
  const results = await fetchNominatimResults(city);
  const result = selectGeocodingResult(results, city);
  if (!result) {
    throw new WeatherLookupError(
      `Could not find "${city}". Check the spelling, or try a nearby larger city or town instead.`,
    );
  }
  return result;
}

/**
 * Pure mapping from the Open-Meteo response shape to our own DailyForecast[]
 * type, isolated from the fetch call so response-parsing bugs are testable
 * without mocking a network request.
 */
export function parseDailyForecast(daily: OpenMeteoForecastResponse["daily"]): DailyForecast[] {
  return daily.time.map((date, i) => ({
    date,
    precipitationSumMm: daily.precipitation_sum[i],
    windSpeedMaxKmh: daily.wind_speed_10m_max[i],
    tempMaxC: daily.temperature_2m_max[i],
    tempMinC: daily.temperature_2m_min[i],
    weatherCode: daily.weather_code[i],
  }));
}

async function fetchWeatherUncached(city: string): Promise<WeatherData> {
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
  const data = (await res.json()) as OpenMeteoForecastResponse;

  return {
    locationName: location.name,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    currentTempC: data.current.temperature_2m,
    currentPrecipitationMm: data.current.precipitation,
    currentWindKmh: data.current.wind_speed_10m,
    daily: parseDailyForecast(data.daily),
  };
}

const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
const weatherCache = createTtlCache<WeatherData>(WEATHER_CACHE_TTL_MS);

/**
 * Same city/forecast lookups repeat often in normal use — most notably the
 * language-auto-regenerate flow, which re-requests a plan for the same city
 * moments later. Caching here skips the geocoding + forecast round trip
 * (and Nominatim's 1s throttle) entirely on a cache hit.
 */
export async function fetchWeather(city: string): Promise<WeatherData> {
  const cacheKey = city.trim().toLowerCase();
  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchWeatherUncached(city);
  weatherCache.set(cacheKey, data);
  return data;
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
