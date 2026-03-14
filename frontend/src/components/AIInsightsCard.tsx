import { formatCurrency } from "@/domain";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ExplainResponse } from "@/lib/api";
import type { AffordabilitySummary } from "@/domain";

interface Props {
  explain: ExplainResponse;
  affordability: AffordabilitySummary | null;
  onAskAdvisor: () => void;
}

export function AIInsightsCard({ explain, affordability, onAskAdvisor }: Props) {
  const showLowBuffer =
    affordability &&
    affordability.remaining_needs_after_housing < 500 &&
    affordability.remaining_needs_after_housing >= 0;

  return (
    <Card className="lg:col-span-2 ring-1 ring-[var(--color-primary)]/10">
      <CardHeader>
        <CardTitle className="text-[var(--color-text-primary)]">Insights</CardTitle>
      </CardHeader>
      <div className="space-y-5">
        {explain.summary && (
          <p className="text-[var(--color-text-primary)] font-medium leading-snug">{explain.summary}</p>
        )}
        {explain.narrative && (
          <div className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed space-y-2">
            {explain.narrative
              .split(/\n\n+/)
              .filter((p) => p.trim())
              .slice(0, 2)
              .map((para, i) => (
                <p key={i}>{para.trim()}</p>
              ))}
          </div>
        )}
        {showLowBuffer && (
          <div
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--color-warning)", backgroundColor: "var(--warning-bg)" }}
          >
            <p className="text-sm font-medium text-[var(--color-warning)]">
              Limited buffer: {formatCurrency(affordability!.remaining_needs_after_housing)} left in
              needs after housing. Consider a lower price or higher income.
            </p>
          </div>
        )}
        {explain.suggestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Recommendations
            </p>
            <ul className="space-y-2">
              {explain.suggestions.slice(0, 5).map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[15px] text-[var(--color-text-secondary)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={onAskAdvisor}
          aria-label="Open Advisor"
        >
          Ask Advisor
        </Button>
      </div>
    </Card>
  );
}
