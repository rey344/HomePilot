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
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Industry-standard thresholds for safe home financing
        </p>
      </CardHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        {riskAnalysis.indicators.map((indicator, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between rounded-lg border p-3"
            style={indicatorStyle(indicator.level)}
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{indicator.message}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Target: ≤{indicator.threshold}%</p>
            </div>
            <div className="text-right ml-2">
              <p className="text-xs">{levelLabel(indicator.level)}</p>
            </div>
          </div>
        ))}
      </div>
      {riskAnalysis.warnings.length > 0 && (
        <div
          className="mt-4 rounded-lg border p-4"
          style={{ borderColor: "var(--color-warning)", backgroundColor: "var(--warning-bg)" }}
        >
          <p className="font-medium text-[var(--color-warning)]">Risk Warnings</p>
          <ul className="mt-2 space-y-1">
            {riskAnalysis.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
      {riskAnalysis.strengths.length > 0 && (
        <div
          className="mt-4 rounded-lg border p-4"
          style={{ borderColor: "var(--color-success)", backgroundColor: "var(--success-bg)" }}
        >
          <p className="font-medium text-[var(--color-success)]">Financial Strengths</p>
          <ul className="mt-2 space-y-1">
            {riskAnalysis.strengths.map((strength, i) => (
              <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                • {strength}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
