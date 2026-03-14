import { formatCurrency } from "@/domain";
import type { PitiBreakdown } from "@/domain";
import type { AffordabilitySummary } from "@/domain/budget";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

function BarSegment({
  label,
  amount,
  widthPct,
  barColor,
}: {
  label: string;
  amount: number;
  widthPct: number;
  barColor: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--color-text-muted)]">{label}</span>
        <span className="font-medium">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.min(100, widthPct)}%`, backgroundColor: barColor }}
          role="progressbar"
          aria-valuenow={widthPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export function ScenarioMonthlyCostCard({ piti }: { piti: PitiBreakdown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly housing cost</CardTitle>
      </CardHeader>
      <ul className="space-y-3">
        {[
          ["Principal & interest", piti.principalAndInterest],
          ["Property tax", piti.propertyTaxMonthly],
          ["Insurance", piti.insuranceMonthly],
          ["PMI", piti.pmiMonthly],
          ["HOA", piti.hoaMonthly],
          ["Maintenance", piti.maintenanceMonthly],
        ].map(([label, val]) => (
          <li key={String(label)} className="flex justify-between text-[15px]">
            <span className="text-[var(--color-text-muted)]">{label}</span>
            <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
              {formatCurrency(Number(val))}
            </span>
          </li>
        ))}
        <li
          className="flex justify-between border-t pt-4 text-base font-semibold"
          style={{ borderColor: "var(--color-border)" }}
        >
          <span>Total</span>
          <span className="tabular-nums text-[var(--color-primary)]">{formatCurrency(piti.totalMonthly)}</span>
        </li>
      </ul>
    </Card>
  );
}

export function ScenarioAffordabilityCard({ affordability }: { affordability: AffordabilitySummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>50/30/20 budget</CardTitle>
        <p
          className="mt-2 text-sm font-medium"
          style={{
            color:
              affordability.housing_pct_of_income <= 40
                ? "var(--color-success)"
                : affordability.housing_pct_of_income <= 50
                  ? "var(--color-warning)"
                  : "var(--color-danger)",
          }}
        >
          {affordability.message}
        </p>
      </CardHeader>
      <div className="space-y-4">
        <BarSegment
          label="Needs (50%)"
          amount={affordability.needs_budget_50}
          widthPct={50}
          barColor="var(--color-primary)"
        />
        <BarSegment
          label="Wants (30%)"
          amount={affordability.wants_budget_30}
          widthPct={30}
          barColor="var(--color-wants)"
        />
        <BarSegment
          label="Savings (20%)"
          amount={affordability.savings_budget_20}
          widthPct={20}
          barColor="var(--color-success)"
        />
        <p className="pt-2 text-xs text-[var(--color-text-muted)]">
          Housing is {affordability.housing_pct_of_income.toFixed(1)}% of your income
        </p>
      </div>
    </Card>
  );
}
