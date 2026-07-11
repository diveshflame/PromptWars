import type { ChecklistItem, Severity, UserInput, WeatherData } from "./types";

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export class LlmError extends Error {}

export interface LlmPlanContent {
  before: string[];
  during: string[];
  after: string[];
  checklist: ChecklistItem[];
  safetyRecommendations: string[];
  travelAdvisory: string;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    before: { type: "array", items: { type: "string" } },
    during: { type: "array", items: { type: "string" } },
    after: { type: "array", items: { type: "string" } },
    checklist: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          quantity: { type: "string" },
        },
        required: ["item", "quantity"],
      },
    },
    safetyRecommendations: { type: "array", items: { type: "string" } },
    travelAdvisory: { type: "string" },
  },
  required: ["before", "during", "after", "checklist", "safetyRecommendations", "travelAdvisory"],
};

function buildPrompt(
  input: UserInput,
  weather: WeatherData,
  severity: Severity,
  baseChecklist: ChecklistItem[],
): string {
  const upcoming = weather.daily
    .slice(0, 3)
    .map((d) => `${d.date}: ${d.precipitationSumMm}mm rain, wind up to ${d.windSpeedMaxKmh} km/h, ${d.tempMinC}-${d.tempMaxC}C`)
    .join("\n");

  return `You are a monsoon/disaster-preparedness assistant. Respond ONLY in this language: ${input.language}.

Location: ${weather.locationName}, ${weather.country}
Household size: ${input.householdSize}
Current conditions: ${weather.currentTempC}C, ${weather.currentPrecipitationMm}mm precipitation, ${weather.currentWindKmh} km/h wind
3-day forecast:
${upcoming}
Assessed severity level: ${severity}

Base emergency checklist (quantities already calculated for this household size - keep the quantities, translate/personalize the item names and add a short tailoring note if useful):
${baseChecklist.map((c) => `- ${c.item}: ${c.quantity}`).join("\n")}

Generate a JSON response with:
- before: 3-5 short preparedness actions to take before the event, specific to this forecast and household size
- during: 3-5 short safety actions during the event
- after: 3-5 short recovery actions after the event
- checklist: the base checklist above, with item names translated/personalized into the target language, quantities preserved
- safetyRecommendations: 2-4 recommendations specific to the current severity level (${severity})
- travelAdvisory: ONE short sentence cautioning about travel, calibrated to the severity level

Everything in the response must be written in ${input.language}.`;
}

export async function generatePlan(
  input: UserInput,
  weather: WeatherData,
  severity: Severity,
  baseChecklist: ChecklistItem[],
): Promise<LlmPlanContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new LlmError("GEMINI_API_KEY is not configured");
  }

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(input, weather, severity, baseChecklist) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new LlmError(`Gemini API request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as GeminiGenerateContentResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new LlmError("Gemini API returned no content");
  }

  return JSON.parse(text) as LlmPlanContent;
}
