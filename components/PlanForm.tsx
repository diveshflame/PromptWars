"use client";

import { memo, useCallback, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { getSpeechLocale } from "@/lib/speechLocales";
import type { UserInput } from "@/lib/types";
import type { UiStrings } from "@/lib/uiStrings";
import { useSpeechRecognition } from "./useSpeechRecognition";

const LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Marathi",
  "Tamil",
  "Telugu",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Spanish",
  "French",
];

interface PlanFormProps {
  onSubmit: (input: UserInput) => void;
  isLoading: boolean;
  language: string;
  onLanguageChange: (language: string) => void;
  strings: UiStrings;
}

function PlanFormComponent({ onSubmit, isLoading, language, onLanguageChange, strings }: PlanFormProps) {
  const [city, setCity] = useState("");
  const [householdSize, setHouseholdSize] = useState(1);
  const [isUnderstandingVoice, setIsUnderstandingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState(false);

  const handleVoiceResult = useCallback(async (transcript: string) => {
    setVoiceError(false);
    setIsUnderstandingVoice(true);
    try {
      const res = await fetch("/api/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok || (data.city === null && data.householdSize === null)) {
        setVoiceError(true);
        return;
      }
      if (data.city) setCity(data.city);
      if (data.householdSize) setHouseholdSize(data.householdSize);
    } catch {
      setVoiceError(true);
    } finally {
      setIsUnderstandingVoice(false);
    }
  }, []);

  const { isSupported: isVoiceSupported, isListening, start: startListening, stop: stopListening } =
    useSpeechRecognition({ lang: getSpeechLocale(language), onResult: handleVoiceResult });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    onSubmit({ city: city.trim(), householdSize, language });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5" aria-label="Monsoon preparedness request form">
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-slate-200">
          {strings.city}
        </label>
        <input
          id="city"
          name="city"
          type="text"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={strings.cityPlaceholder}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
        />
      </div>

      <div>
        <label htmlFor="householdSize" className="block text-sm font-medium text-slate-200">
          {strings.householdSize}
        </label>
        <input
          id="householdSize"
          name="householdSize"
          type="number"
          min={1}
          max={20}
          required
          value={householdSize}
          onChange={(e) => setHouseholdSize(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
        />
      </div>

      {isVoiceSupported && (
        <div>
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isUnderstandingVoice}
            aria-pressed={isListening}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 transition-colors hover:border-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isListening ? (
              <MicOff aria-hidden="true" className="h-4 w-4 text-teal-400" />
            ) : (
              <Mic aria-hidden="true" className="h-4 w-4" />
            )}
            {isListening
              ? strings.listening
              : isUnderstandingVoice
                ? strings.understandingVoice
                : strings.voiceInputLabel}
          </button>
          {voiceError && (
            <p role="alert" className="mt-1.5 text-xs text-red-300">
              {strings.voiceInputError}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-slate-200">
          {strings.language}
        </label>
        <select
          id="language"
          name="language"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-teal-500 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? strings.submitting : strings.submit}
      </button>
    </form>
  );
}

export const PlanForm = memo(PlanFormComponent);
