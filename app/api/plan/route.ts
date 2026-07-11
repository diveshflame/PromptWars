import { NextResponse } from "next/server";
import { computeChecklist } from "@/lib/checklist";
import { generatePlan, LlmError } from "@/lib/llm";
import type { PreparednessPlan, UserInput } from "@/lib/types";
import { fetchWeather, getSeverity, WeatherLookupError } from "@/lib/weather";

const SEVERITY_ALERTS: Record<string, string> = {
  severe: "Severe weather expected in the next 3 days. Review your emergency plan now.",
  extreme: "Extreme weather warning: significant rainfall or wind expected in the next 3 days. Prepare immediately.",
};

function parseInput(body: unknown): UserInput | null {
  if (typeof body !== "object" || body === null) return null;
  const { city, householdSize, language } = body as Record<string, unknown>;

  if (typeof city !== "string" || city.trim().length === 0 || city.length > 100) return null;
  if (typeof language !== "string" || language.trim().length === 0 || language.length > 50) return null;

  const size = Number(householdSize);
  if (!Number.isFinite(size) || size < 1 || size > 20 || !Number.isInteger(size)) return null;

  return { city: city.trim(), householdSize: size, language: language.trim() };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Invalid input. Provide city, householdSize (1-20), and language." },
      { status: 400 },
    );
  }

  try {
    const weather = await fetchWeather(input.city);
    const severity = getSeverity(weather);
    const baseChecklist = computeChecklist(input.householdSize);
    const llmContent = await generatePlan(input, weather, severity, baseChecklist);

    const plan: PreparednessPlan = {
      severity,
      alert: SEVERITY_ALERTS[severity] ?? null,
      before: llmContent.before,
      during: llmContent.during,
      after: llmContent.after,
      checklist: llmContent.checklist,
      safetyRecommendations: llmContent.safetyRecommendations,
      travelAdvisory: llmContent.travelAdvisory,
    };

    return NextResponse.json({ weather, plan });
  } catch (err) {
    if (err instanceof WeatherLookupError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof LlmError) {
      return NextResponse.json({ error: "Failed to generate preparedness plan. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
