import { memo } from "react";
import type { UiStrings } from "@/lib/uiStrings";

export type LoadingStage = "weather" | "plan";

interface LoadingIndicatorProps {
  stage: LoadingStage;
  strings: UiStrings;
}

function LoadingIndicatorComponent({ stage, strings }: LoadingIndicatorProps) {
  const text = stage === "weather" ? strings.fetchingForecast : strings.generatingPlan;
  return (
    <div role="status" className="flex w-full max-w-md items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-4 text-sm text-slate-300">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-teal-400"
      />
      <span>{text}</span>
    </div>
  );
}

export const LoadingIndicator = memo(LoadingIndicatorComponent);
