import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("parseVoiceInput", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.GEMINI_API_KEY = originalKey;
  });

  function mockGeminiResponse(json: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] }),
      }),
    );
  }

  it("extracts city and household size from a natural spoken sentence", async () => {
    mockGeminiResponse({ city: "Mumbai", householdSize: 4 });

    const { parseVoiceInput } = await import("./llm");
    const result = await parseVoiceInput("I'm in Mumbai, we are four people");

    expect(result).toEqual({ city: "Mumbai", householdSize: 4 });
  });

  it("returns nulls for fields the speaker didn't mention", async () => {
    mockGeminiResponse({ city: "Chennai", householdSize: null });

    const { parseVoiceInput } = await import("./llm");
    const result = await parseVoiceInput("Chennai");

    expect(result).toEqual({ city: "Chennai", householdSize: null });
  });

  it("discards a household size outside the 1-20 range", async () => {
    mockGeminiResponse({ city: "Delhi", householdSize: 25 });

    const { parseVoiceInput } = await import("./llm");
    const result = await parseVoiceInput("Delhi, twenty five people");

    expect(result).toEqual({ city: "Delhi", householdSize: null });
  });

  it("throws LlmError when the API key is not configured", async () => {
    delete process.env.GEMINI_API_KEY;

    const { parseVoiceInput, LlmError } = await import("./llm");
    await expect(parseVoiceInput("Mumbai")).rejects.toBeInstanceOf(LlmError);
  });
});
