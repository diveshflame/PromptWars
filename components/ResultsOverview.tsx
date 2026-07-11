import { memo } from "react";
import { CloudRain, Wind, PlaneTakeoff } from "lucide-react";
import type { PreparednessPlan, WeatherData } from "@/lib/types";
import type { UiStrings } from "@/lib/uiStrings";
import { AlertBanner } from "./AlertBanner";
import { CARD_CLASS } from "./styles";

interface ResultsOverviewProps {
  weather: WeatherData;
  plan: PreparednessPlan;
  strings: UiStrings;
}

function ResultsOverviewComponent({ weather, plan, strings }: ResultsOverviewProps) {
  return (
    <div className="w-full space-y-6">
      <div className={CARD_CLASS}>
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

      <div className={CARD_CLASS}>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-teal-300">
          <PlaneTakeoff aria-hidden="true" className="h-5 w-5" />
          {strings.travelAdvisory}
        </h3>
        <p className="mt-2 text-sm text-slate-200">{plan.travelAdvisory}</p>
      </div>
    </div>
  );
}

export const ResultsOverview = memo(ResultsOverviewComponent);
