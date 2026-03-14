"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdvisorChat } from "@/components/AdvisorChat";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/domain";
import type { ScenarioContext } from "@/lib/api";

const STORAGE_KEY = "homepilot_last_scenario";

function riskLabelFromPct(pct: number): string {
  if (pct < 25) return "Safe";
  if (pct <= 30) return "Good";
  if (pct <= 35) return "Stretch";
  return "Risky";
}

export function AdvisorPageContent() {
  const [lastScenario, setLastScenario] = useState<ScenarioContext | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ScenarioContext;
        if (parsed && typeof parsed.home_value === "number" && parsed.home_value > 0) {
          setLastScenario(parsed);
        }
      }
    } catch (_) {}
    setMounted(true);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Advisor
        </h1>
        <p className="mt-2 text-[15px] text-[var(--color-text-muted)] max-w-xl">
          Ask questions about affordability, risk, or budgeting. The advisor uses your calculator scenario when you have one, so you get personalized advice.
        </p>
      </div>

      {!mounted ? (
        <Card className="max-w-[480px]">
          <div className="min-h-[320px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
            Loading…
          </div>
        </Card>
      ) : !lastScenario ? (
        <Card className="max-w-[480px]">
          <CardHeader>
            <CardTitle>No scenario yet</CardTitle>
            <p className="mt-2 text-[15px] text-[var(--color-text-muted)]">
              Run the calculator and click Calculate so the advisor can use your numbers (home value, payment, income) for personalized advice.
            </p>
          </CardHeader>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-11 min-w-[44px] rounded-[var(--radius-input)] px-5 text-sm font-medium text-white transition-all duration-150 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-app)] no-underline"
              style={{ background: "linear-gradient(90deg, #00C9FF, #00E0FF)" }}
            >
              Go to Calculator
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6 max-w-[480px]">
          <Card>
            <CardHeader>
              <CardTitle>Your scenario</CardTitle>
              <p className="mt-2 text-[15px] text-[var(--color-text-muted)]">
                Summary from your last calculation. Ask the advisor about this scenario below.
              </p>
            </CardHeader>
            <ul className="space-y-2 text-[15px]">
              <li className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Home value</span>
                <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                  {formatCurrency(lastScenario.home_value)}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Monthly payment</span>
                <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                  {formatCurrency(lastScenario.monthly_payment_total)}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Risk level</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {riskLabelFromPct(lastScenario.housing_pct_of_income)}
                </span>
              </li>
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <div className="min-h-[360px]">
              <AdvisorChat scenarioContext={lastScenario} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
