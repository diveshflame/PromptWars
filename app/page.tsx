"use client";

import { useState } from "react";
import { PlanForm } from "@/components/PlanForm";
import { ResultsView } from "@/components/ResultsView";
import type { PreparednessPlan, UserInput, WeatherData } from "@/lib/types";

interface ApiResult {
  weather: WeatherData;
  plan: PreparednessPlan;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  async function handleSubmit(input: UserInput) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-slate-950 px-4 py-12 sm:py-16">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-50 sm:text-4xl">Monsoon Ready</h1>
          <p className="mt-2 max-w-md text-slate-400">
            Real-time forecast, AI-personalized preparedness plans, in your language.
          </p>
        </header>

        <PlanForm onSubmit={handleSubmit} isLoading={isLoading} />

        {error && (
          <p role="alert" className="w-full max-w-md rounded-lg border border-red-600 bg-red-900/30 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {result && <ResultsView weather={result.weather} plan={result.plan} />}
      </main>
    </div>
  );
}
