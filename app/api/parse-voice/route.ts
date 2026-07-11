import { NextResponse } from "next/server";
import { LlmError, parseVoiceInput } from "@/lib/llm";

function parseBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const { transcript } = body as Record<string, unknown>;
  if (typeof transcript !== "string" || transcript.trim().length === 0 || transcript.length > 500) return null;
  return transcript.trim();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const transcript = parseBody(body);
  if (!transcript) {
    return NextResponse.json({ error: "Invalid input. Provide a transcript." }, { status: 400 });
  }

  try {
    const result = await parseVoiceInput(transcript);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: "Failed to understand the voice input. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
