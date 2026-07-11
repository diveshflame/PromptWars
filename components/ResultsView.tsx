import { CloudRain, Wind, ShieldCheck, PlaneTakeoff, ListChecks } from "lucide-react";
import type { PreparednessPlan, WeatherData } from "@/lib/types";
import type { UiStrings } from "@/lib/uiStrings";
import { AlertBanner } from "./AlertBanner";

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section aria-labelledby={`section-${title}`} className="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
      <h3 id={`section-${title}`} className="mb-3 text-lg font-semibold text-teal-300">
        {title}
      </h3>
      <ul className="space-y-2 text-sm text-slate-200">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className="text-teal-400">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ResultsOverviewProps {
  weather: WeatherData;
  plan: PreparednessPlan;
  strings: UiStrings;
}

export function ResultsOverview({ weather, plan, strings }: ResultsOverviewProps) {
  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
        <h2 className="text-xl font-bold text-slate-100">
          {weather.locationName}, {weather.country}
        </h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
          <span className="flex items-center gap-1.5">
            <CloudRain aria-hidden="true" className="h-4 w-4 text-sky-400" />
            {weather.currentTempC}°C, {weather.currentPrecipitationMm}mm precipitation
          </span>
          <span className="flex items-center gap-1.5">
            <Wind aria-hidden="true" className="h-4 w-4 text-sky-400" />
            {weather.currentWindKmh} km/h wind
          </span>
        </div>
      </div>

      <AlertBanner severity={plan.severity} alert={plan.alert} strings={strings} />

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-teal-300">
          <PlaneTakeoff aria-hidden="true" className="h-5 w-5" />
          {strings.travelAdvisory}
        </h3>
        <p className="mt-2 text-sm text-slate-200">{plan.travelAdvisory}</p>
      </div>
    </div>
  );
}

interface ResultsDetailsProps {
  plan: PreparednessPlan;
  strings: UiStrings;
}

export function ResultsDetails({ plan, strings }: ResultsDetailsProps) {
  return (
    <div className="w-full space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Section title={strings.before} items={plan.before} />
        <Section title={strings.during} items={plan.during} />
        <Section title={strings.after} items={plan.after} />
      </div>

      <section aria-labelledby="checklist-heading" className="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
        <h3 id="checklist-heading" className="flex items-center gap-2 text-lg font-semibold text-teal-300">
          <ListChecks aria-hidden="true" className="h-5 w-5" />
          {strings.checklist}
        </h3>
        <ul className="mt-3 divide-y divide-slate-700">
          {plan.checklist.map((c, i) => (
            <li key={i} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-slate-200">{c.item}</span>
              <span className="whitespace-nowrap font-medium text-slate-400">{c.quantity}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="safety-heading" className="rounded-lg border border-slate-700 bg-slate-800/50 p-5">
        <h3 id="safety-heading" className="flex items-center gap-2 text-lg font-semibold text-teal-300">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          {strings.safetyRecommendations}
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          {plan.safetyRecommendations.map((rec, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true" className="text-teal-400">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
