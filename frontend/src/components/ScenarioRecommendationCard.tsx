import { formatCurrency } from "@/domain";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { HomeRecommendationResponse } from "@/lib/api";

interface Props {
  homeRecommendation: HomeRecommendationResponse;
  estimatedGrossAnnual: number;
}

export function ScenarioRecommendationCard({ homeRecommendation, estimatedGrossAnnual }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended price range</CardTitle>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Estimated gross income: {formatCurrency(estimatedGrossAnnual)}/year
          <span className="text-xs block mt-1">
            Gross estimated from take-home (÷0.77). Recommended price is 28% of gross.
          </span>
        </p>
      </CardHeader>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-sm text-[var(--color-text-muted)]">Recommended</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-success)]">
              {formatCurrency(homeRecommendation.recommended_price)}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">28% of estimated gross income</p>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-sm text-[var(--color-text-muted)]">Maximum</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {formatCurrency(homeRecommendation.maximum_price)}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">35% of estimated gross income</p>
          </div>
        </div>
        <div
          className="rounded-lg border p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--primary-light)" }}
        >
          <p className="text-sm font-medium text-[var(--color-primary)]">Safe range</p>
          <p className="mt-2 text-lg">
            {formatCurrency(homeRecommendation.safe_min_price)} – {formatCurrency(homeRecommendation.safe_max_price)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Housing stays at 25–30% of income.
          </p>
        </div>
      </div>
    </Card>
  );
}
