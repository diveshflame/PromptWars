"use client";

import { useState } from "react";
import type { UserInput } from "@/lib/types";

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
}

export function PlanForm({ onSubmit, isLoading }: PlanFormProps) {
  const [city, setCity] = useState("");
  const [householdSize, setHouseholdSize] = useState(1);
  const [language, setLanguage] = useState("English");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    onSubmit({ city: city.trim(), householdSize, language });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5" aria-label="Monsoon preparedness request form">
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-slate-200">
          City
        </label>
        <input
          id="city"
          name="city"
          type="text"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Mumbai"
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
        />
      </div>

      <div>
        <label htmlFor="householdSize" className="block text-sm font-medium text-slate-200">
          Household size
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

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-slate-200">
          Language
        </label>
        <select
          id="language"
          name="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
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
        {isLoading ? "Preparing your plan…" : "Get preparedness plan"}
      </button>
    </form>
  );
}
