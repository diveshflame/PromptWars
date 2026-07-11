import { describe, expect, it } from "vitest";
import { getSeverity } from "./weather";
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
