import type { PreparednessPlan, WeatherData } from "./types";
import type { UiStrings } from "./uiStrings";

/** Builds a spoken-friendly summary of the main plan points, for the "read aloud" voice output feature. */
export function buildPlanSpeech(weather: WeatherData, plan: PreparednessPlan, strings: UiStrings): string {
  const parts = [`${weather.locationName}, ${weather.country}.`, `${strings.severity}: ${plan.severity}.`];

  if (plan.alert) parts.push(plan.alert);

  parts.push(`${strings.travelAdvisory}: ${plan.travelAdvisory}`);
  parts.push(`${strings.before}: ${plan.before.join(". ")}.`);
  parts.push(`${strings.during}: ${plan.during.join(". ")}.`);
  parts.push(`${strings.after}: ${plan.after.join(". ")}.`);
  parts.push(`${strings.safetyRecommendations}: ${plan.safetyRecommendations.join(". ")}.`);

  return parts.join(" ");
}
