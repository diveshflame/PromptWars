"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoadingIndicator, type LoadingStage } from "@/components/LoadingIndicator";
import { PlanForm } from "@/components/PlanForm";
import { ResultsDetails } from "@/components/ResultsDetails";
import { ResultsOverview } from "@/components/ResultsOverview";
import { debounce } from "@/lib/debounce";
import type { PreparednessPlan, UserInput, WeatherData } from "@/lib/types";
import { getUiStrings } from "@/lib/uiStrings";

interface ApiResult {
  weather: WeatherData;
  plan: PreparednessPlan;
}

const LANGUAGE_CHANGE_DEBOUNCE_MS = 450;
const WEATHER_STAGE_DURATION_MS = 1200;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("weather");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [language, setLanguage] = useState("English");
  const [submittedInput, setSubmittedInput] = useState<{ city: string; householdSize: number } | null>(null);

  const handleSubmit = useCallback(async (input: UserInput) => {
    setIsLoading(true);
    setLoadingStage("weather");
    setError(null);

    const stageTimer = setTimeout(() => setLoadingStage("plan"), WEATHER_STAGE_DURATION_MS);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(data);
      setSubmittedInput({ city: input.city, householdSize: input.householdSize });
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      clearTimeout(stageTimer);
      setIsLoading(false);
    }
  }, []);

  // The debounced call only forwards to handleSubmit; it's cancelled on
  // unmount (see effect below) so a pending regenerate can't fire against a
  // dead component after the user navigates away mid-debounce.
  const debouncedRegenerate = useMemo(
    () =>
      debounce((lang: string, input: { city: string; householdSize: number }) => {
        handleSubmit({ ...input, language: lang });
      }, LANGUAGE_CHANGE_DEBOUNCE_MS),
    [handleSubmit],
  );

  useEffect(() => {
    return () => debouncedRegenerate.cancel();
  }, [debouncedRegenerate]);

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      setLanguage(newLanguage);
      if (result && submittedInput) {
        debouncedRegenerate(newLanguage, submittedInput);
      }
    },
    [result, submittedInput, debouncedRegenerate],
  );

  const strings = useMemo(() => getUiStrings(language), [language]);

  return (
    <div className="flex flex-1 flex-col items-center bg-slate-950 px-4 py-10 sm:py-12">
      <main className="w-full max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-50 sm:text-4xl">Monsoon Ready</h1>
          <p className="mx-auto mt-2 max-w-md text-slate-400">{strings.subtitle}</p>
        </header>

        <div className={result ? "grid gap-6 lg:grid-cols-[minmax(320px,380px)_1fr] lg:items-start" : undefined}>
          <div
            className={
              result
                ? "flex flex-col items-center gap-6 lg:items-stretch"
                : "mx-auto flex w-full max-w-md flex-col gap-6"
            }
          >
            <PlanForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              language={language}
              onLanguageChange={handleLanguageChange}
              strings={strings}
            />

            {isLoading && <LoadingIndicator stage={loadingStage} strings={strings} />}

            {error && (
              <p role="alert" className="w-full max-w-md rounded-lg border border-red-600 bg-red-900/30 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            {result && (
              <div className="fade-in w-full">
                <ResultsOverview weather={result.weather} plan={result.plan} strings={strings} language={language} />
              </div>
            )}
          </div>

          {result && (
            <div className="fade-in">
              <ResultsDetails plan={result.plan} strings={strings} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
