import type { ReactNode } from "react";
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

/** Split narrative into short blocks for easier scanning (paragraphs and long sentences). */
function narrativeBlocks(narrative: string): string[] {
  const paragraphs = narrative.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const blocks: string[] = [];
  const maxChunk = 220;
  for (const para of paragraphs) {
    if (para.length <= maxChunk) {
      blocks.push(para);
    } else {
      const sentences = para.split(/(?<=[.!])\s+/).filter(Boolean);
      let current = "";
      for (const s of sentences) {
        if (current.length + s.length + 1 <= maxChunk && current.length > 0) {
          current += " " + s;
        } else {
          if (current) blocks.push(current.trim());
          current = s;
        }
      }
      if (current.trim()) blocks.push(current.trim());
    }
  }
  return blocks.slice(0, 6);
}

/** Wrap currency ($1,234) and percentages (26.5%) in emphasized spans. */
function withEmphasizedNumbers(text: string): ReactNode {
  const parts = text.split(/(\$[\d,]+(?:\.\d{2})?|[\d.]+%)/g);
  return parts.map((part, i) => {
    if (/^\$[\d,]+(?:\.\d{2})?$/.test(part) || /^[\d.]+%$/.test(part)) {
      return (
        <span key={i} className="font-semibold tabular-nums text-[var(--color-text-primary)]">
          {part}
        </span>
      );
    }
    return part;
  });
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
          <div className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed space-y-3">
            {narrativeBlocks(explain.narrative).map((block, i) => (
              <p key={i} className="leading-relaxed">
                {withEmphasizedNumbers(block)}
              </p>
            ))}
          </div>
        )}
        {showLowBuffer && (
          <div
            className="rounded-[var(--radius-input)] border-l-4 border-[var(--color-warning)] px-4 py-3"
            style={{ backgroundColor: "var(--warning-bg)" }}
          >
            <p className="text-sm text-[var(--color-text-primary)]">
              <span className="font-semibold text-[var(--color-warning)]">Low buffer: </span>
              {formatCurrency(affordability!.remaining_needs_after_housing)} left after housing. Consider a lower price or higher income.
            </p>
          </div>
        )}
        {explain.suggestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-3">
              Recommendations
            </p>
            <ol className="space-y-3 list-none pl-0">
              {explain.suggestions.slice(0, 5).map((s, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[15px] text-[var(--color-text-secondary)] leading-relaxed"
                >
                  <span
                    className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-[var(--color-primary)]"
                    style={{ backgroundColor: "var(--primary-light)" }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span>{withEmphasizedNumbers(s)}</span>
                </li>
              ))}
            </ol>
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
