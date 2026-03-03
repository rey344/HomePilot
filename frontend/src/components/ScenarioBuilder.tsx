"use client";

import { useState } from "react";
import {
  calculateAffordabilitySummary,
  formatCurrency,
  validateScenario,
  amortizationSchedule,
  calculateLoanAmount,
  type Scenario,
  type AffordabilityResult,
  type FieldErrors,
  type AmortizationRow,
} from "@/domain";
import { fetchExplain, type ExplainResponse } from "@/lib/api";
import { parseApiError } from "@/lib/validate";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const ROWS_PER_PAGE = 60;

/** Raw string state for inputs — no coercion; allows empty and typing. */
type InputValues = Record<keyof Scenario, string>;

const defaultScenario: Scenario = {
  homeValue: 350000,
  downPayment: 70000,
  annualRatePercent: 6.5,
  termYears: 30,
  annualPropertyTaxPercent: 1.2,
  annualInsurancePercent: 0.35,
  hoaMonthly: 0,
  annualMaintenancePercent: 0.5,
  monthlyTakeHomeIncome: 6500,
  otherMonthlyNeeds: 800,
};

function inputValuesFromScenario(s: Scenario): InputValues {
  return {
    homeValue: String(s.homeValue),
    downPayment: String(s.downPayment),
    annualRatePercent: String(s.annualRatePercent),
    termYears: String(s.termYears),
    annualPropertyTaxPercent: String(s.annualPropertyTaxPercent),
    annualInsurancePercent: String(s.annualInsurancePercent),
    hoaMonthly: String(s.hoaMonthly),
    annualMaintenancePercent: String(s.annualMaintenancePercent),
    monthlyTakeHomeIncome: String(s.monthlyTakeHomeIncome),
    otherMonthlyNeeds: String(s.otherMonthlyNeeds),
  };
}

/** Parse strings to numbers; empty or invalid → NaN. No coercion. */
function parseScenarioFromInputs(inputs: InputValues): Scenario {
  const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
  return {
    homeValue: num(inputs.homeValue),
    downPayment: num(inputs.downPayment),
    annualRatePercent: num(inputs.annualRatePercent),
    termYears: num(inputs.termYears), // keep as number/NaN; normalize later on submit
    annualPropertyTaxPercent: num(inputs.annualPropertyTaxPercent),
    annualInsurancePercent: num(inputs.annualInsurancePercent),
    hoaMonthly: num(inputs.hoaMonthly),
    annualMaintenancePercent: num(inputs.annualMaintenancePercent),
    monthlyTakeHomeIncome: num(inputs.monthlyTakeHomeIncome),
    otherMonthlyNeeds: num(inputs.otherMonthlyNeeds),
  };
}

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

function BalanceChart({ schedule }: { schedule: AmortizationRow[] }) {
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
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="min-h-[120px] w-full"
        aria-label="Remaining balance over time"
      >
        <polyline
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    </div>
  );
}

export default function ScenarioBuilder() {
  const [inputValues, setInputValues] = useState<InputValues>(() =>
    inputValuesFromScenario(defaultScenario)
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [result, setResult] = useState<AffordabilityResult | null>(null);
  const [committedScenario, setCommittedScenario] = useState<Scenario | null>(null);
  const [explain, setExplain] = useState<ExplainResponse | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullAmortization, setShowFullAmortization] = useState(false);
  const [fullSchedule, setFullSchedule] = useState<AmortizationRow[] | null>(null);
  const [amortizationPage, setAmortizationPage] = useState(1);

  const clearZeroOnFocus = (field: keyof Scenario) => {
    setInputValues((v) => {
      const current = v[field];
      // If the field is literally "0" (common for optional costs), clear it so typing works naturally.
      if (current === "0") return { ...v, [field]: "" };
      return v;
    });
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parseScenarioFromInputs(inputValues);
    const validation = validateScenario(parsed);
    if (validation) {
      setFieldErrors({ ...validation, _form: "Fix errors below to calculate." });
      setResult(null);
      setCommittedScenario(null);
      setExplain(null);
      setFullSchedule(null);
      setShowFullAmortization(false);
      return;
    }
    setFieldErrors(null);
    const scenario: Scenario = {
      ...parsed,
      termYears: (() => {
        const n = Number(parsed.termYears);
        if (!Number.isFinite(n)) return NaN;
        return Math.max(1, Math.min(30, Math.floor(n)));
      })(),
    };
    const scenarioValidation = validateScenario(scenario);
    if (scenarioValidation) {
      setFieldErrors({ ...scenarioValidation, _form: "Fix errors below to calculate." });
      setResult(null);
      setCommittedScenario(null);
      setExplain(null);
      setFullSchedule(null);
      setShowFullAmortization(false);
      return;
    }
    setCommittedScenario(scenario);
    const computed = calculateAffordabilitySummary(scenario, ROWS_PER_PAGE);
    setResult(computed);
    setFullSchedule(null);
    setShowFullAmortization(false);
    setAmortizationPage(1);

    setLoadingExplain(true);
    fetchExplain(
      computed.affordability.monthly_income,
      computed.affordability.monthly_housing,
      computed.affordability.other_needs,
      computed.affordability.is_affordable,
      computed.affordability.housing_pct_of_income,
      computed.affordability.needs_budget_50,
      computed.affordability.remaining_needs_after_housing
    )
      .then(setExplain)
      .catch((err) => setError(parseApiError(err)))
      .finally(() => setLoadingExplain(false));
  };

  const handleBlur = (field: keyof Scenario) => {
    const parsed = parseScenarioFromInputs(inputValues);
    const validation = validateScenario(parsed);
    if (validation && field in validation) {
      setFieldErrors((prev) => ({ ...prev, [field]: validation[field as keyof typeof validation]! }));
    } else {
      setFieldErrors((prev) => {
        if (!prev) return null;
        const next = { ...prev };
        delete next[field as keyof FieldErrors];
        delete next._form;
        return Object.keys(next).length === 0 ? null : next;
      });
    }
  };

  const showFullTerm = () => {
    if (!committedScenario || !result) return;
    const loanAmount = calculateLoanAmount(committedScenario.homeValue, committedScenario.downPayment);
    const totalMonths = committedScenario.termYears * 12;
    const schedule = amortizationSchedule(
      loanAmount,
      committedScenario.annualRatePercent,
      committedScenario.termYears,
      totalMonths
    );
    setFullSchedule(schedule);
    setShowFullAmortization(true);
    setAmortizationPage(1);
  };

  const piti = result?.piti;
  const affordability = result?.affordability;
  const amortization = result?.amortization;
  const displaySchedule = showFullAmortization && fullSchedule ? fullSchedule : amortization?.schedule ?? [];
  const totalPages = Math.ceil(displaySchedule.length / ROWS_PER_PAGE) || 1;
  const page = Math.min(amortizationPage, totalPages) || 1;
  const pageRows =
    displaySchedule.length <= ROWS_PER_PAGE
      ? displaySchedule
      : displaySchedule.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const first60 = (amortization?.schedule ?? []).slice(0, 60);
  const interest5yr = first60.reduce((s, r) => s + r.interest, 0);
  const principal5yr = first60.reduce((s, r) => s + r.principal, 0);

  return (
    <div className="relative min-h-screen">
      <header
        className="border-b bg-[var(--color-surface-card)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-8">
          <h1 className="text-[32px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            HomePilot
          </h1>
          <p className="mt-2 text-[15px] text-[var(--color-text-muted)]">
            True cost of homeownership · 50/30/20 affordability · AI-guided insights
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] px-4 py-8 sm:px-8">
        <form onSubmit={handleCalculate} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your scenario</CardTitle>
              <p className="mt-2 text-[15px] text-[var(--color-text-muted)]">
                Enter loan details, property costs, and income. Click Calculate to update results.
              </p>
            </CardHeader>

            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Loan
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    label="Home value ($)"
                    type="text"
                    inputMode="decimal"
                    value={inputValues.homeValue}
                    onChange={(e) => setInputValues((v) => ({ ...v, homeValue: e.target.value }))}
                    onBlur={() => handleBlur("homeValue")}
                    error={fieldErrors?.homeValue}
                  />
                  <Input
                    label="Down payment ($)"
                    type="text"
                    inputMode="decimal"
                    value={inputValues.downPayment}
                    onChange={(e) => setInputValues((v) => ({ ...v, downPayment: e.target.value }))}
                    onBlur={() => handleBlur("downPayment")}
                    error={fieldErrors?.downPayment}
                  />
                  <Input
                    label="Interest rate (%)"
                    type="text"
                    inputMode="decimal"
                    value={inputValues.annualRatePercent}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, annualRatePercent: e.target.value }))
                    }
                    onBlur={() => handleBlur("annualRatePercent")}
                    error={fieldErrors?.annualRatePercent}
                  />
                  <Input
                    label="Term (years)"
                    type="text"
                    inputMode="numeric"
                    value={inputValues.termYears}
                    onChange={(e) => setInputValues((v) => ({ ...v, termYears: e.target.value }))}
                    onBlur={() => handleBlur("termYears")}
                    error={fieldErrors?.termYears}
                  />
                </div>
              </section>

              <div role="separator" className="border-t" style={{ borderColor: "var(--color-border)" }} />

              <section className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Property & fees
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    label="Property tax (%/year)"
                    type="text"
                    inputMode="decimal"
                    value={inputValues.annualPropertyTaxPercent}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, annualPropertyTaxPercent: e.target.value }))
                    }
                    onBlur={() => handleBlur("annualPropertyTaxPercent")}
                  />
                  <Input
                    label="Insurance (%/year)"
                    type="text"
                    inputMode="decimal"
                    value={inputValues.annualInsurancePercent}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, annualInsurancePercent: e.target.value }))
                    }
                    onBlur={() => handleBlur("annualInsurancePercent")}
                  />
                  <Input
                    label="HOA ($/month)"
                    type="text"
                    inputMode="decimal"
                    value={inputValues.hoaMonthly}
                    onFocus={() => clearZeroOnFocus("hoaMonthly")}
                    onChange={(e) => setInputValues((v) => ({ ...v, hoaMonthly: e.target.value }))}
                    onBlur={() => handleBlur("hoaMonthly")}
                  />
                  <Input
                    label="Maintenance (%/year)"
                    type="text"
                    inputMode="decimal"
                    value={inputValues.annualMaintenancePercent}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, annualMaintenancePercent: e.target.value }))
                    }
                    onBlur={() => handleBlur("annualMaintenancePercent")}
                  />
                </div>
              </section>

              <div role="separator" className="border-t" style={{ borderColor: "var(--color-border)" }} />

              <section className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Your income
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Monthly take-home ($)"
                    type="text"
                    inputMode="decimal"
                    value={inputValues.monthlyTakeHomeIncome}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, monthlyTakeHomeIncome: e.target.value }))
                    }
                    onBlur={() => handleBlur("monthlyTakeHomeIncome")}
                    error={fieldErrors?.monthlyTakeHomeIncome}
                  />
                  <Input
                    label="Other monthly needs ($)"
                    type="text"
                    inputMode="decimal"
                    value={inputValues.otherMonthlyNeeds}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, otherMonthlyNeeds: e.target.value }))
                    }
                    onBlur={() => handleBlur("otherMonthlyNeeds")}
                    error={fieldErrors?.otherMonthlyNeeds}
                  />
                </div>
              </section>

              <div className="pt-2">
                <Button type="submit">Calculate affordability</Button>
              </div>
            </div>
          </Card>

          {(error || fieldErrors?._form) && (
            <Card className="bg-[var(--warning-bg)]">
              <p className="text-[var(--color-text-primary)]" role="alert">
                {error ?? fieldErrors?._form}
              </p>
            </Card>
          )}

          {result && (
            <>
              <p className="text-[15px] text-[var(--color-text-muted)]" role="status">
                Results are for the scenario at the time you clicked Calculate. Edit inputs and
                click Calculate again to update.
              </p>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly housing cost</CardTitle>
                  </CardHeader>
                  <ul className="space-y-3">
                    {[
                      ["Principal & interest", piti!.principalAndInterest],
                      ["Property tax", piti!.propertyTaxMonthly],
                      ["Insurance", piti!.insuranceMonthly],
                      ["PMI", piti!.pmiMonthly],
                      ["HOA", piti!.hoaMonthly],
                      ["Maintenance", piti!.maintenanceMonthly],
                    ].map(([label, val]) => (
                      <li key={String(label)} className="flex justify-between text-[15px]">
                        <span className="text-[var(--color-text-muted)]">{label}</span>
                        <span className="font-medium tabular-nums text-[var(--color-text-primary)]">{formatCurrency(Number(val))}</span>
                      </li>
                    ))}
                    <li className="flex justify-between border-t pt-4 text-base font-semibold" style={{ borderColor: "var(--color-border)" }}>
                      <span>Total</span>
                      <span className="tabular-nums text-[var(--color-primary)]">
                        {formatCurrency(piti!.totalMonthly)}
                      </span>
                    </li>
                  </ul>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>50/30/20 budget</CardTitle>
                    <p
                      className="mt-2 text-sm font-medium"
                      style={{
                        color:
                          affordability!.housing_pct_of_income <= 40
                            ? "var(--color-success)"
                            : affordability!.housing_pct_of_income <= 50
                              ? "var(--color-warning)"
                              : "var(--color-danger)",
                      }}
                    >
                      {affordability!.message}
                    </p>
                  </CardHeader>
                  <div className="space-y-4">
                    <BarSegment
                      label="Needs (50%)"
                      amount={affordability!.needs_budget_50}
                      widthPct={50}
                      barColor="var(--color-primary)"
                    />
                    <BarSegment
                      label="Wants (30%)"
                      amount={affordability!.wants_budget_30}
                      widthPct={30}
                      barColor="var(--color-wants)"
                    />
                    <BarSegment
                      label="Savings (20%)"
                      amount={affordability!.savings_budget_20}
                      widthPct={20}
                      barColor="var(--color-success)"
                    />
                    <p className="pt-2 text-xs text-[var(--color-text-muted)]">
                      Housing is {affordability!.housing_pct_of_income.toFixed(1)}% of your income
                    </p>
                  </div>
                </Card>

                {explain && (
                  <Card className="lg:col-span-2 bg-[var(--primary-light)]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-[var(--color-primary)]">AI summary</span>
                      </CardTitle>
                    </CardHeader>
                    <p className="leading-relaxed text-[var(--color-text-secondary)]">{explain.narrative}</p>
                    {explain.suggestions.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {explain.suggestions.map((s, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-500)]" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                )}
                {loadingExplain && (
                  <p className="text-sm text-[var(--color-text-muted)] lg:col-span-2">Loading summary…</p>
                )}
              </div>

              {amortization && displaySchedule.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>
                      Amortization{" "}
                      {showFullAmortization
                        ? `(${fullSchedule?.length ?? 0} months)`
                        : "(first 60 months)"}
                    </CardTitle>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Monthly payment: {formatCurrency(amortization.monthlyPayment)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      PMI is included when LTV &gt; 80%; it typically drops when balance reaches 80%
                      of home value.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={!showFullAmortization ? "primary" : "secondary"}
                        onClick={() => {
                          setShowFullAmortization(false);
                          setAmortizationPage(1);
                        }}
                      >
                        First 60 months
                      </Button>
                      <Button
                        type="button"
                        variant={showFullAmortization ? "primary" : "secondary"}
                        onClick={showFullTerm}
                      >
                        Full term
                      </Button>
                    </div>
                  </CardHeader>
                  <div className="space-y-4 px-6 pb-6">
                    <p className="text-sm text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text-primary)]">First 5 years:</span>{" "}
                      Interest paid {formatCurrency(interest5yr)} · Principal gained{" "}
                      {formatCurrency(principal5yr)}
                    </p>
                    <BalanceChart schedule={displaySchedule} />
                    {totalPages > 1 && (
                      <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                        <span>
                          Months {(page - 1) * ROWS_PER_PAGE + 1}–
                          {Math.min(page * ROWS_PER_PAGE, displaySchedule.length)} of{" "}
                          {displaySchedule.length}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setAmortizationPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                        >
                          Previous
                        </Button>
                        <span>
                          Page {page} of {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setAmortizationPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                    <div className="overflow-x-auto rounded-[var(--radius-input)] border" style={{ borderColor: "var(--color-border)" }}>
                      <table className="min-w-[500px] w-full text-[14px] font-normal tabular-nums">
                        <thead className="sticky top-0 z-10 bg-[var(--color-surface-card)]" style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <tr className="text-[var(--color-text-muted)]">
                            <th className="pb-3 pt-3 pl-4 pr-4 text-left text-xs font-medium uppercase tracking-[0.05em]">Month</th>
                            <th className="pb-3 pt-3 pr-4 text-right text-xs font-medium uppercase tracking-[0.05em]">Payment</th>
                            <th className="pb-3 pt-3 pr-4 text-right text-xs font-medium uppercase tracking-[0.05em]">Principal</th>
                            <th className="pb-3 pt-3 pr-4 text-right text-xs font-medium uppercase tracking-[0.05em]">Interest</th>
                            <th className="pb-3 pt-3 pr-4 text-right text-xs font-medium uppercase tracking-[0.05em]">Balance</th>
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
                              <td className="py-3 pr-4 text-right text-[var(--color-success)]">{formatCurrency(row.principal)}</td>
                              <td className="py-3 pr-4 text-right text-[var(--color-text-muted)]">{formatCurrency(row.interest)}</td>
                              <td className="py-3 pr-4 text-right">{formatCurrency(row.balance)}</td>
                            </tr>
                          ))}
                          <tr className="font-semibold bg-white/[0.04]" style={{ borderTop: "1px solid var(--color-border)" }}>
                            <td className="py-3 pl-4 pr-4 text-left">Total{totalPages > 1 ? " (page)" : ""}</td>
                            <td className="py-3 pr-4 text-right">{formatCurrency(pageRows.reduce((s, r) => s + r.payment, 0))}</td>
                            <td className="py-3 pr-4 text-right text-[var(--color-success)]">{formatCurrency(pageRows.reduce((s, r) => s + r.principal, 0))}</td>
                            <td className="py-3 pr-4 text-right text-[var(--color-text-muted)]">{formatCurrency(pageRows.reduce((s, r) => s + r.interest, 0))}</td>
                            <td className="py-3 pr-4 text-right">
                              {pageRows.length > 0 ? formatCurrency(pageRows[pageRows.length - 1].balance) : "—"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </form>
      </main>
    </div>
  );
}
