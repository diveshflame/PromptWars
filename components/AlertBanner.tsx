import { memo } from "react";
import type { Severity } from "@/lib/types";
import type { UiStrings } from "@/lib/uiStrings";

const SEVERITY_STYLES: Record<Severity, string> = {
  low: "bg-emerald-900/40 border-emerald-500 text-emerald-200",
  moderate: "bg-amber-900/40 border-amber-500 text-amber-200",
  severe: "bg-orange-900/40 border-orange-500 text-orange-200",
  extreme: "bg-red-900/40 border-red-500 text-red-200",
};

interface AlertBannerProps {
  severity: Severity;
  alert: string | null;
  strings: UiStrings;
}

function AlertBannerComponent({ severity, alert, strings }: AlertBannerProps) {
  return (
    <div
      role="alert"
      className={`w-full rounded-lg border-l-4 px-4 py-3 ${SEVERITY_STYLES[severity]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">
        {strings.severity}: {severity}
      </p>
      {alert && <p className="mt-1 text-sm">{alert}</p>}
    </div>
  );
}

export const AlertBanner = memo(AlertBannerComponent);
