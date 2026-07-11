import { describe, expect, it } from "vitest";
import { buildPlanSpeech } from "./planSummary";
import { getUiStrings } from "./uiStrings";
import type { PreparednessPlan, WeatherData } from "./types";

const weather: WeatherData = {
  locationName: "Mumbai",
  country: "India",
  latitude: 19.07,
  longitude: 72.88,
  currentTempC: 28,
  currentPrecipitationMm: 5,
  currentWindKmh: 20,
  daily: [],
};

const plan: PreparednessPlan = {
  severity: "severe",
  alert: "Severe weather expected in the next 3 days.",
  before: ["Stock up on water"],
  during: ["Stay indoors"],
  after: ["Check for damage"],
  checklist: [{ item: "Water", quantity: "9 liters" }],
  safetyRecommendations: ["Avoid flooded roads"],
  travelAdvisory: "Avoid non-essential travel.",
};

describe("buildPlanSpeech", () => {
  it("includes the location, severity, alert, and every plan section", () => {
    const speech = buildPlanSpeech(weather, plan, getUiStrings("English"));

    expect(speech).toContain("Mumbai, India.");
    expect(speech).toContain("Severity: severe.");
    expect(speech).toContain("Severe weather expected in the next 3 days.");
    expect(speech).toContain("Avoid non-essential travel.");
    expect(speech).toContain("Stock up on water");
    expect(speech).toContain("Stay indoors");
    expect(speech).toContain("Check for damage");
    expect(speech).toContain("Avoid flooded roads");
  });

  it("omits the alert sentence when there is none", () => {
    const speech = buildPlanSpeech(weather, { ...plan, alert: null }, getUiStrings("English"));
    expect(speech).not.toContain("null");
  });
});
