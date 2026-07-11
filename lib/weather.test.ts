import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSeverity, parseDailyForecast, selectGeocodingResult } from "./weather";
import type { DailyForecast } from "./types";

function day(precipitationSumMm: number, windSpeedMaxKmh: number): DailyForecast {
  return {
    date: "2026-07-01",
    precipitationSumMm,
    windSpeedMaxKmh,
    tempMaxC: 30,
    tempMinC: 24,
    weatherCode: 61,
  };
}

describe("getSeverity", () => {
  it("returns low when rainfall and wind are both mild", () => {
    expect(getSeverity({ daily: [day(2, 10), day(3, 12)] })).toBe("low");
  });

  it("returns moderate at the IMD moderate-rain threshold", () => {
    expect(getSeverity({ daily: [day(15.6, 10)] })).toBe("moderate");
  });

  it("returns severe when heavy rainfall occurs within the 3-day horizon", () => {
    expect(getSeverity({ daily: [day(0, 0), day(70, 10)] })).toBe("severe");
  });

  it("returns extreme when wind alone crosses the storm threshold", () => {
    expect(getSeverity({ daily: [day(0, 90)] })).toBe("extreme");
  });

  it("only considers the first 3 days of the forecast", () => {
    const daily = [day(0, 0), day(0, 0), day(0, 0), day(300, 100)];
    expect(getSeverity({ daily })).toBe("low");
  });
});

describe("selectGeocodingResult", () => {
  it("prefers the most specific address field: city over town over village over county", () => {
    const result = selectGeocodingResult(
      [{ lat: "12.9", lon: "77.5", address: { city: "Bengaluru", town: "Ignored", country: "India" } }],
      "bengaluru",
    );
    expect(result).toEqual({ latitude: 12.9, longitude: 77.5, name: "Bengaluru", country: "India" });
  });

  it("falls back to town, then village, then county when city is absent", () => {
    expect(
      selectGeocodingResult([{ lat: "1", lon: "2", address: { town: "Moodabidri" } }], "Moodbidri"),
    ).toMatchObject({ name: "Moodabidri" });
    expect(
      selectGeocodingResult([{ lat: "1", lon: "2", address: { village: "Small Village" } }], "query"),
    ).toMatchObject({ name: "Small Village" });
    expect(
      selectGeocodingResult([{ lat: "1", lon: "2", address: { county: "Some County" } }], "query"),
    ).toMatchObject({ name: "Some County" });
  });

  it("falls back to the original query text when no address fields are present", () => {
    const result = selectGeocodingResult([{ lat: "1", lon: "2" }], "Query City");
    expect(result).toMatchObject({ name: "Query City", country: "" });
  });

  it("returns null when there are no results, without needing any network mocking", () => {
    expect(selectGeocodingResult([], "anywhere")).toBeNull();
  });
});

describe("parseDailyForecast", () => {
  it("maps parallel Open-Meteo arrays into one DailyForecast per day", () => {
    const forecast = parseDailyForecast({
      time: ["2026-07-11", "2026-07-12"],
      precipitation_sum: [5.4, 10],
      wind_speed_10m_max: [21.8, 30],
      weather_code: [95, 61],
      temperature_2m_max: [29.8, 28],
      temperature_2m_min: [27.2, 26],
    });

    expect(forecast).toEqual([
      { date: "2026-07-11", precipitationSumMm: 5.4, windSpeedMaxKmh: 21.8, tempMaxC: 29.8, tempMinC: 27.2, weatherCode: 95 },
      { date: "2026-07-12", precipitationSumMm: 10, windSpeedMaxKmh: 30, tempMaxC: 28, tempMinC: 26, weatherCode: 61 },
    ]);
  });
});

describe("fetchWeather geocoding fallback", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws a friendly, retryable error suggesting a nearby city when nothing is found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );

    const { fetchWeather, WeatherLookupError } = await import("./weather");

    try {
      await fetchWeather("Notarealplacexyz");
      expect.fail("expected fetchWeather to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(WeatherLookupError);
      expect((err as Error).message).toMatch(/nearby larger city/i);
    }
  });

  it("throws a friendly error when the geocoding request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));

    const { fetchWeather, WeatherLookupError } = await import("./weather");

    await expect(fetchWeather("Anywhere")).rejects.toBeInstanceOf(WeatherLookupError);
  });
});

describe("fetchWeather caching", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serves a repeated lookup for the same city from cache instead of refetching", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("nominatim")) {
        return {
          ok: true,
          json: async () => [{ lat: "19.07", lon: "72.88", address: { city: "Mumbai", country: "India" } }],
        };
      }
      return {
        ok: true,
        json: async () => ({
          current: { temperature_2m: 28, precipitation: 0, wind_speed_10m: 10 },
          daily: {
            time: ["2026-07-11"],
            precipitation_sum: [5],
            wind_speed_10m_max: [20],
            weather_code: [61],
            temperature_2m_max: [30],
            temperature_2m_min: [25],
          },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchWeather } = await import("./weather");

    const first = await fetchWeather("Mumbai");
    const second = await fetchWeather("mumbai"); // different case, should still be a cache hit

    expect(second).toEqual(first);
    // 2 calls total (geocode + forecast) for the first lookup only; the
    // second lookup is served entirely from cache.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
