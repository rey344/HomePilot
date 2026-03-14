import { formatCurrency } from "@/domain";
import { toNum } from "@/lib/coerce";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { FiveYearProjection, YearProjection } from "@/lib/api";

interface Props {
  fiveYearProjection: FiveYearProjection;
}

export function FiveYearProjectionCard({ fiveYearProjection }: Props) {
  const proj = fiveYearProjection;
  const projectedHomeValue = toNum(proj.projected_home_value);
  const projectedEquity = toNum(proj.projected_equity);
  const netWorthChange = toNum(proj.net_worth_change);
  const annualRate = toNum(proj.annual_appreciation_rate);
  const totalPayments = toNum(proj.total_payments);
  const totalInterest = toNum(proj.total_interest_paid);
  const yearlyDetails: YearProjection[] = Array.isArray(proj.yearly_details) ? proj.yearly_details : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>5-year projection</CardTitle>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Home value growth at {annualRate}% annual appreciation
        </p>
      </CardHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs text-[var(--color-text-muted)]">Home Value (Year 5)</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-success)]">
              {formatCurrency(projectedHomeValue)}
            </p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs text-[var(--color-text-muted)]">Total Equity</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-primary)]">
              {formatCurrency(projectedEquity)}
            </p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs text-[var(--color-text-muted)]">Net Worth Change</p>
            <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
              {formatCurrency(netWorthChange, true)}
            </p>
          </div>
        </div>
        {yearlyDetails.length > 0 && (
          <div className="space-y-2">
            {yearlyDetails.map((year, idx) => {
              const eq = toNum(year.equity);
              const pct = projectedEquity > 0 ? (eq / projectedEquity) * 100 : 0;
              return (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-[var(--color-text-muted)]">
                    Year {year.year ?? idx + 1}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="h-1.5 flex-1 overflow-hidden rounded-full"
                      style={{ backgroundColor: "var(--color-border)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: "var(--color-success)",
                        }}
                      />
                    </div>
                    <span className="w-24 text-right font-medium">{formatCurrency(eq)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div
          className="mt-3 rounded-lg border p-3 text-xs text-[var(--color-text-muted)]"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--primary-light)",
          }}
        >
          <p className="font-medium text-[var(--color-primary)]">Projection notes</p>
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            <li>Assumes {annualRate}% annual home appreciation</li>
            <li>Equity = Down payment + Principal paid + Home appreciation</li>
            <li>Total payments over 5 years: {formatCurrency(totalPayments)}</li>
            <li>Total interest paid: {formatCurrency(totalInterest)}</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
