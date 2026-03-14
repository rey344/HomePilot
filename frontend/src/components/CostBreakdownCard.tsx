import { formatCurrency } from "@/domain";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CostBreakdown } from "@/lib/api";

interface Props {
  costBreakdown: CostBreakdown;
}

const BREAKDOWN_ITEMS: Array<{ key: keyof CostBreakdown; label: string; color: string }> = [
  { key: "principal_and_interest", label: "Principal & Interest", color: "var(--color-primary)" },
  { key: "property_tax", label: "Property Tax", color: "rgb(59, 130, 246)" },
  { key: "insurance", label: "Insurance", color: "rgb(16, 185, 129)" },
  { key: "pmi", label: "PMI", color: "rgb(251, 191, 36)" },
  { key: "hoa", label: "HOA", color: "rgb(168, 85, 247)" },
  { key: "maintenance", label: "Maintenance", color: "rgb(239, 68, 68)" },
];

export function CostBreakdownCard({ costBreakdown }: Props) {
  const total = costBreakdown.total;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost breakdown</CardTitle>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Monthly housing cost distribution
        </p>
      </CardHeader>
      <div className="space-y-4">
        {BREAKDOWN_ITEMS.filter((item) => (costBreakdown[item.key] as number) > 0).map((item) => {
          const amount = costBreakdown[item.key] as number;
          const percentage = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div key={item.key} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-text-muted)]">{item.label}</span>
                  <span className="font-medium">
                    {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: "var(--color-border)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <div
          className="pt-3 border-t flex justify-between font-semibold"
          style={{ borderColor: "var(--color-border)" }}
        >
          <span>Total Monthly</span>
          <span className="text-[var(--color-primary)]">{formatCurrency(total)}</span>
        </div>
      </div>
    </Card>
  );
}
