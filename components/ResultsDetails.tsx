import { memo } from "react";
import { ShieldCheck, ListChecks } from "lucide-react";
import type { PreparednessPlan } from "@/lib/types";
import type { UiStrings } from "@/lib/uiStrings";
import { BulletList } from "./BulletList";
import { CARD_CLASS } from "./styles";

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section aria-labelledby={`section-${title}`} className={CARD_CLASS}>
      <h3 id={`section-${title}`} className="mb-3 text-lg font-semibold text-teal-300">
        {title}
      </h3>
      <BulletList items={items} />
    </section>
  );
}

interface ResultsDetailsProps {
  plan: PreparednessPlan;
  strings: UiStrings;
}

function ResultsDetailsComponent({ plan, strings }: ResultsDetailsProps) {
  return (
    <div className="w-full space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Section title={strings.before} items={plan.before} />
        <Section title={strings.during} items={plan.during} />
        <Section title={strings.after} items={plan.after} />
      </div>

      <section aria-labelledby="checklist-heading" className={CARD_CLASS}>
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

      <section aria-labelledby="safety-heading" className={CARD_CLASS}>
        <h3 id="safety-heading" className="flex items-center gap-2 text-lg font-semibold text-teal-300">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          {strings.safetyRecommendations}
        </h3>
        <BulletList items={plan.safetyRecommendations} className="mt-3 space-y-2 text-sm text-slate-200" />
      </section>
    </div>
  );
}

export const ResultsDetails = memo(ResultsDetailsComponent);
