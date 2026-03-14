import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { RiskAnalysis } from "@/lib/api";

interface Props {
  riskAnalysis: RiskAnalysis;
}

function indicatorStyle(level: string): { borderColor: string; backgroundColor: string } {
  if (level === "safe")
    return { borderColor: "var(--color-success)", backgroundColor: "var(--success-bg)" };
  if (level === "moderate")
    return { borderColor: "var(--color-warning)", backgroundColor: "var(--warning-bg)" };
  return { borderColor: "var(--color-danger)", backgroundColor: "var(--danger-bg)" };
}

function levelLabel(level: string): string {
  if (level === "safe") return "Safe";
  if (level === "moderate") return "Moderate";
  return "High Risk";
}

export function RiskAnalysisCard({ riskAnalysis }: Props) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Financial risk indicators</CardTitle>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Industry-standard thresholds for safe home financing
        </p>
      </CardHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        {riskAnalysis.indicators.map((indicator, idx) => (
          <div
            key={idx}
            className="rounded-[var(--radius-input)] border p-4"
            style={indicatorStyle(indicator.level)}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-[var(--color-text-primary)] leading-snug">
                  {indicator.message}
                </p>
                <span
                  className="shrink-0 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: indicator.level === "safe" ? "var(--color-success)" : indicator.level === "moderate" ? "var(--color-warning)" : "var(--color-danger)" }}
                >
                  {levelLabel(indicator.level)}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Target: ≤{indicator.threshold}%
              </p>
            </div>
          </div>
        ))}
      </div>
      {riskAnalysis.warnings.length > 0 && (
        <div
          className="mt-6 rounded-[var(--radius-input)] border-l-4 border-[var(--color-warning)] p-4"
          style={{ backgroundColor: "var(--warning-bg)" }}
        >
          <p className="text-sm font-semibold text-[var(--color-warning)]">Risk warnings</p>
          <ul className="mt-2 space-y-1.5">
            {riskAnalysis.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-[var(--color-text-primary)] leading-snug">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
      {riskAnalysis.strengths.length > 0 && (
        <div
          className="mt-6 rounded-[var(--radius-input)] border p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--success-bg)" }}
        >
          <p className="text-sm font-semibold text-[var(--color-success)]">Financial strengths</p>
          <ul className="mt-2 space-y-1.5">
            {riskAnalysis.strengths.map((strength, i) => (
              <li key={i} className="text-sm text-[var(--color-text-primary)] leading-snug">
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
