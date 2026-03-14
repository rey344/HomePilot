"use client";

import { useState, useRef } from "react";
import { formatCurrency } from "@/domain";
import type { AmortizationRow } from "@/domain";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function BalanceChart({ schedule }: { schedule: AmortizationRow[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<{
    row: AmortizationRow;
    index: number;
    x: number;
    y: number;
  } | null>(null);

  if (schedule.length < 2) return null;
  const maxBalance = Math.max(...schedule.map((r) => r.balance));
  const minBalance = Math.min(...schedule.map((r) => r.balance));
  const range = maxBalance - minBalance || 1;
  const w = 400;
  const h = 120;
  const pts = schedule
    .map((r, i) => {
      const x = (i / (schedule.length - 1)) * w;
      const y = h - ((r.balance - minBalance) / range) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const viewX = ((e.clientX - rect.left) / rect.width) * w;
    const index = Math.round((viewX / w) * (schedule.length - 1));
    const clamped = Math.max(0, Math.min(index, schedule.length - 1));
    const row = schedule[clamped];
    setHovered({ row, index: clamped, x: e.clientX, y: e.clientY });
  };

  const hoveredX = hovered ? (hovered.index / (schedule.length - 1)) * w : null;
  const hoveredY =
    hovered && range ? h - ((hovered.row.balance - minBalance) / range) * (h - 8) - 4 : null;

  return (
    <div className="overflow-x-auto relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="min-h-[120px] w-full cursor-crosshair"
        aria-label="Remaining balance over time. Hover for month details."
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <polyline
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          points={pts}
        />
        {hovered && hoveredX != null && hoveredY != null && (
          <circle
            cx={hoveredX}
            cy={hoveredY}
            r="5"
            fill="var(--color-primary)"
            stroke="var(--color-surface-card)"
            strokeWidth="2"
            aria-hidden
          />
        )}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none fixed z-50 rounded-xl shadow-xl border min-w-[180px]"
          style={{
            left: hovered.x + 12,
            top: hovered.y + 8,
            backgroundColor: "var(--color-surface-card)",
            borderColor: "rgba(0, 201, 255, 0.35)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(0, 201, 255, 0.15)",
          }}
          role="tooltip"
        >
          <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--color-border)" }}>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              Month {hovered.row.month}
            </span>
          </div>
          <div className="px-4 py-3 space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)]">Balance</span>
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(hovered.row.balance)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)]">Principal</span>
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(hovered.row.principal)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)]">Interest</span>
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(hovered.row.interest)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export interface AmortizationCardProps {
  monthlyPayment: number;
  displaySchedule: AmortizationRow[];
  showFullAmortization: boolean;
  fullScheduleLength: number;
  interest5yr: number;
  principal5yr: number;
  page: number;
  totalPages: number;
  rowsPerPage: number;
  pageRows: AmortizationRow[];
  onShowFirst60: () => void;
  onShowFullTerm: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function AmortizationCard({
  monthlyPayment,
  displaySchedule,
  showFullAmortization,
  fullScheduleLength,
  interest5yr,
  principal5yr,
  page,
  totalPages,
  rowsPerPage,
  pageRows,
  onShowFirst60,
  onShowFullTerm,
  onPrevPage,
  onNextPage,
}: AmortizationCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>
          Amortization {showFullAmortization ? `(${fullScheduleLength} months)` : "(first 60 months)"}
        </CardTitle>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Monthly payment: {formatCurrency(monthlyPayment)}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          PMI is included when LTV &gt; 80%; it typically drops when balance reaches 80% of home value.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={!showFullAmortization ? "primary" : "secondary"}
            onClick={onShowFirst60}
          >
            First 60 months
          </Button>
          <Button
            type="button"
            variant={showFullAmortization ? "primary" : "secondary"}
            onClick={onShowFullTerm}
          >
            Full term
          </Button>
        </div>
      </CardHeader>
      <div className="space-y-4 px-6 pb-6">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text-primary)]">First 5 years:</span> Interest
          paid {formatCurrency(interest5yr)} · Principal gained {formatCurrency(principal5yr)}
        </p>
        <BalanceChart schedule={displaySchedule} />
        {totalPages > 1 && (
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
            <span>
              Months {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, displaySchedule.length)} of{" "}
              {displaySchedule.length}
            </span>
            <Button type="button" variant="ghost" onClick={onPrevPage} disabled={page <= 1}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button type="button" variant="ghost" onClick={onNextPage} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        )}
        <div
          className="overflow-x-auto rounded-[var(--radius-input)] border"
          style={{ borderColor: "var(--color-border)" }}
        >
          <table className="min-w-[500px] w-full text-[14px] font-normal tabular-nums">
            <thead
              className="sticky top-0 z-10 bg-[var(--color-surface-card)]"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <tr className="text-[var(--color-text-muted)]">
                <th className="pb-3 pt-3 pl-4 pr-4 text-left text-xs font-medium uppercase tracking-[0.05em]">
                  Month
                </th>
                <th className="pb-3 pt-3 pr-4 text-right text-xs font-medium uppercase tracking-[0.05em]">
                  Payment
                </th>
                <th className="pb-3 pt-3 pr-4 text-right text-xs font-medium uppercase tracking-[0.05em]">
                  Principal
                </th>
                <th className="pb-3 pt-3 pr-4 text-right text-xs font-medium uppercase tracking-[0.05em]">
                  Interest
                </th>
                <th className="pb-3 pt-3 pr-4 text-right text-xs font-medium uppercase tracking-[0.05em]">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={row.month}
                  className="transition-colors hover:bg-white/[0.03]"
                  style={{
                    backgroundColor: i % 2 === 1 ? "rgba(255,255,255,0.03)" : undefined,
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <td className="py-3 pl-4 pr-4 text-left">{row.month}</td>
                  <td className="py-3 pr-4 text-right">{formatCurrency(row.payment)}</td>
                  <td className="py-3 pr-4 text-right text-[var(--color-success)]">
                    {formatCurrency(row.principal)}
                  </td>
                  <td className="py-3 pr-4 text-right text-[var(--color-text-muted)]">
                    {formatCurrency(row.interest)}
                  </td>
                  <td className="py-3 pr-4 text-right">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
              <tr className="font-semibold bg-white/[0.04]" style={{ borderTop: "1px solid var(--color-border)" }}>
                <td className="py-3 pl-4 pr-4 text-left">Total{totalPages > 1 ? " (page)" : ""}</td>
                <td className="py-3 pr-4 text-right">
                  {formatCurrency(pageRows.reduce((s, r) => s + r.payment, 0))}
                </td>
                <td className="py-3 pr-4 text-right text-[var(--color-success)]">
                  {formatCurrency(pageRows.reduce((s, r) => s + r.principal, 0))}
                </td>
                <td className="py-3 pr-4 text-right text-[var(--color-text-muted)]">
                  {formatCurrency(pageRows.reduce((s, r) => s + r.interest, 0))}
                </td>
                <td className="py-3 pr-4 text-right">
                  {pageRows.length > 0 ? formatCurrency(pageRows[pageRows.length - 1].balance) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
