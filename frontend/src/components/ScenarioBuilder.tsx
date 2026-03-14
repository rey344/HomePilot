"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import {
  defaultScenario,
  inputValuesFromScenario,
  parseScenarioFromInputs,
  type InputValues,
} from "@/lib/scenarioForm";
import {
  fetchExplain,
  fetchEnhancedLoanAnalysis,
  type ExplainResponse,
  type EnhancedLoanAnalysisResponse,
  type ScenarioContext,
} from "@/lib/api";
import { GROSS_FROM_TAKEHOME } from "@/hooks/useHomeRecommendation";
import { useToasts } from "@/hooks/useToasts";
import { useHomeRecommendation } from "@/hooks/useHomeRecommendation";
import { parseApiError } from "@/lib/validate";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ToastContainer } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { AdvisorChat } from "@/components/AdvisorChat";
import { ScenarioMonthlyCostCard, ScenarioAffordabilityCard } from "@/components/ScenarioResultSummary";
import { ScenarioRecommendationCard } from "@/components/ScenarioRecommendationCard";
import { RiskAnalysisCard } from "@/components/RiskAnalysisCard";
import { CostBreakdownCard } from "@/components/CostBreakdownCard";
import { FiveYearProjectionCard } from "@/components/FiveYearProjectionCard";
import { AIInsightsCard } from "@/components/AIInsightsCard";
import { SavedScenariosDropdown } from "@/components/SavedScenariosDropdown";
import { AmortizationCard } from "@/components/AmortizationCard";

const ROWS_PER_PAGE = 60;

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
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedLoanAnalysisResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<Array<{ name: string; scenario: Scenario }>>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const formActionsRef = useRef<HTMLDivElement>(null);

  const { toasts, addToast, removeToast } = useToasts();
  const { homeRecommendation, loadingRecommendation } = useHomeRecommendation(
    inputValues.monthlyTakeHomeIncome
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("homepilot_scenarios");
      if (saved) {
        setSavedScenarios(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load scenarios:", err);
    }
  }, []);

  const saveScenario = () => {
    const name = prompt("Name this scenario:");
    if (!name) return;
    
    const parsed = parseScenarioFromInputs(inputValues);
    const validation = validateScenario(parsed);
    if (validation) {
      addToast("Fix validation errors before saving.", "error");
      return;
    }

    const newScenarios = [...savedScenarios, { name, scenario: parsed }];
    setSavedScenarios(newScenarios);
    localStorage.setItem("homepilot_scenarios", JSON.stringify(newScenarios));
    addToast(`Saved "${name}".`, "success");
  };

  const loadScenario = (scenario: Scenario, name: string) => {
    setInputValues(inputValuesFromScenario(scenario));
    setFieldErrors(null);
    setResult(null);
    setCommittedScenario(null);
    setExplain(null);
    setEnhancedAnalysis(null);
    addToast(`Loaded "${name}"`, "info");
  };

  const deleteScenario = (index: number, name: string) => {
    const newScenarios = savedScenarios.filter((_, i) => i !== index);
    setSavedScenarios(newScenarios);
    localStorage.setItem("homepilot_scenarios", JSON.stringify(newScenarios));
    addToast(`Deleted "${name}"`, "info");
  };

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
      setFieldErrors({ ...validation, _form: "Fix the errors below, then calculate." });
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
        const clamped = Math.max(1, Math.min(30, Math.floor(n)));
        // Warn user if term was clamped
        if (clamped !== n && Number.isFinite(n)) {
          setError(`Term adjusted to ${clamped} years (valid range: 1-30 years).`);
        }
        return clamped;
      })(),
    };
    const scenarioValidation = validateScenario(scenario);
    if (scenarioValidation) {
      setFieldErrors({ ...scenarioValidation, _form: "Fix the errors below, then calculate." });
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

    // Fetch enhanced analysis with risk indicators and projections
    setLoadingAnalysis(true);
    setLoadingExplain(true);
    fetchEnhancedLoanAnalysis({
      home_value: scenario.homeValue,
      down_payment: scenario.downPayment,
      annual_rate_pct: scenario.annualRatePercent,
      term_years: scenario.termYears,
      annual_property_tax_pct: scenario.annualPropertyTaxPercent,
      annual_insurance_pct: scenario.annualInsurancePercent,
      hoa_monthly: scenario.hoaMonthly,
      maintenance_monthly_pct: scenario.annualMaintenancePercent / 12,
      monthly_gross_income: scenario.monthlyTakeHomeIncome * GROSS_FROM_TAKEHOME,
      monthly_take_home_income: scenario.monthlyTakeHomeIncome,
      other_monthly_needs: scenario.otherMonthlyNeeds,
    })
      .then((enhanced) => {
        setEnhancedAnalysis(enhanced);
        const riskSummary = [
          `Overall risk: ${enhanced.risk_analysis.overall_risk}.`,
          ...enhanced.risk_analysis.indicators.map((i) => i.message),
          ...enhanced.risk_analysis.warnings,
          ...enhanced.risk_analysis.strengths,
        ].join(" ");
        const proj = enhanced.five_year_projection;
        const projectionSummary = `In 5 years: home value ~${formatCurrency(proj.projected_home_value)}, equity ~${formatCurrency(proj.projected_equity)}, net worth change ${formatCurrency(proj.net_worth_change)}. Total interest paid in 5 yr: ${formatCurrency(proj.total_interest_paid)}.`;
        return fetchExplain(
          computed.affordability.monthly_income,
          computed.affordability.monthly_housing,
          computed.affordability.other_needs,
          computed.affordability.is_affordable,
          computed.affordability.housing_pct_of_income,
          computed.affordability.needs_budget_50,
          computed.affordability.remaining_needs_after_housing,
          computed.piti.pmiMonthly,
          scenario.termYears,
          riskSummary,
          projectionSummary
        );
      })
      .then(setExplain)
      .catch((err) => {
        setError(parseApiError(err));
        setExplain(null);
      })
      .finally(() => {
        setLoadingAnalysis(false);
        setLoadingExplain(false);
      });
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

  // When validation errors appear, keep the form actions (Calculate button) in view
  useEffect(() => {
    if (fieldErrors && formActionsRef.current) {
      formActionsRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [fieldErrors]);

  const scenarioContext: ScenarioContext | null =
    committedScenario && result && affordability && piti
      ? {
          home_value: committedScenario.homeValue,
          down_payment: committedScenario.downPayment,
          monthly_payment_total: piti.totalMonthly,
          monthly_income: affordability.monthly_income,
          is_affordable: affordability.is_affordable,
          housing_pct_of_income: affordability.housing_pct_of_income,
          risk_summary: enhancedAnalysis
            ? [
                `Overall risk: ${enhancedAnalysis.risk_analysis.overall_risk}.`,
                ...enhancedAnalysis.risk_analysis.indicators.map((i) => i.message),
                ...enhancedAnalysis.risk_analysis.warnings,
                ...enhancedAnalysis.risk_analysis.strengths,
              ].join(" ")
            : null,
          projection_summary: enhancedAnalysis?.five_year_projection
            ? `In 5 years: home value ~${formatCurrency(enhancedAnalysis.five_year_projection.projected_home_value)}, equity ~${formatCurrency(enhancedAnalysis.five_year_projection.projected_equity)}, net worth change ${formatCurrency(enhancedAnalysis.five_year_projection.net_worth_change)}.`
            : null,
        }
      : null;

  useEffect(() => {
    if (scenarioContext != null) {
      try {
        localStorage.setItem("homepilot_last_scenario", JSON.stringify(scenarioContext));
      } catch (_) {}
    }
  }, [scenarioContext]);

  return (
    <div className="relative z-10">
      <main className="py-6 sm:py-8 pb-12">
        <form onSubmit={handleCalculate} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your scenario</CardTitle>
              <p className="mt-2 text-[15px] text-[var(--color-text-muted)]">
                Enter loan and income details below. Click Calculate to see monthly cost, budget fit, and risk analysis.
              </p>
            </CardHeader>

            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  Loan
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    id="homeValue"
                    label="Home value ($)"
                    type="number"
                    min={0}
                    step={1000}
                    value={inputValues.homeValue}
                    onChange={(e) => setInputValues((v) => ({ ...v, homeValue: e.target.value }))}
                    onBlur={() => handleBlur("homeValue")}
                    error={fieldErrors?.homeValue}
                    aria-label="Home value in dollars"
                  />
                  <Input
                    id="downPayment"
                    label="Down payment ($)"
                    type="number"
                    min={0}
                    step={1000}
                    value={inputValues.downPayment}
                    onChange={(e) => setInputValues((v) => ({ ...v, downPayment: e.target.value }))}
                    onBlur={() => handleBlur("downPayment")}
                    error={fieldErrors?.downPayment}
                    aria-label="Down payment in dollars"
                  />
                  <Input
                    id="annualRatePercent"
                    label="Interest rate (%)"
                    type="number"
                    min={0}
                    max={30}
                    step={0.125}
                    value={inputValues.annualRatePercent}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, annualRatePercent: e.target.value }))
                    }
                    onBlur={() => handleBlur("annualRatePercent")}
                    error={fieldErrors?.annualRatePercent}
                    aria-label="Annual interest rate percent"
                  />
                  <Input
                    id="termYears"
                    label="Term (years)"
                    type="number"
                    min={1}
                    max={30}
                    step={1}
                    value={inputValues.termYears}
                    onChange={(e) => setInputValues((v) => ({ ...v, termYears: e.target.value }))}
                    onBlur={() => handleBlur("termYears")}
                    error={fieldErrors?.termYears}
                    aria-label="Loan term in years"
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
                    id="annualPropertyTaxPercent"
                    label={
                      <Tooltip content="Typically 0.5-2.5% of home value per year" position="top" id="tooltip-property-tax">
                        <span>Property tax (%/year)</span>
                      </Tooltip>
                    }
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={inputValues.annualPropertyTaxPercent}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, annualPropertyTaxPercent: e.target.value }))
                    }
                    onBlur={() => handleBlur("annualPropertyTaxPercent")}
                    aria-label="Property tax percent per year (typically 0.5-2.5%)"
                  />
                  <Input
                    id="annualInsurancePercent"
                    label={
                      <Tooltip content="Usually 0.3-0.5% of home value per year" position="top" id="tooltip-insurance">
                        <span>Insurance (%/year)</span>
                      </Tooltip>
                    }
                    type="number"
                    min={0}
                    max={5}
                    step={0.05}
                    value={inputValues.annualInsurancePercent}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, annualInsurancePercent: e.target.value }))
                    }
                    onBlur={() => handleBlur("annualInsurancePercent")}
                    aria-label="Insurance percent per year (usually 0.3-0.5%)"
                  />
                  <Input
                    id="hoaMonthly"
                    label="HOA ($/month)"
                    type="number"
                    min={0}
                    step={10}
                    value={inputValues.hoaMonthly}
                    onFocus={() => clearZeroOnFocus("hoaMonthly")}
                    onChange={(e) => setInputValues((v) => ({ ...v, hoaMonthly: e.target.value }))}
                    onBlur={() => handleBlur("hoaMonthly")}
                    aria-label="HOA fee in dollars per month"
                  />
                  <Input
                    id="annualMaintenancePercent"
                    label="Maintenance (%/year)"
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={inputValues.annualMaintenancePercent}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, annualMaintenancePercent: e.target.value }))
                    }
                    onBlur={() => handleBlur("annualMaintenancePercent")}
                    aria-label="Maintenance reserve percent of home value per year"
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
                    id="monthlyTakeHomeIncome"
                    label={
                      <Tooltip content="Your net income after taxes. We estimate gross income as take-home ÷ 0.77 (≈23% effective tax) for the recommended price range." position="top" id="tooltip-net-income">
                        <span>Monthly net income ($)</span>
                      </Tooltip>
                    }
                    type="number"
                    min={0}
                    step={100}
                    value={inputValues.monthlyTakeHomeIncome}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, monthlyTakeHomeIncome: e.target.value }))
                    }
                    onBlur={() => handleBlur("monthlyTakeHomeIncome")}
                    error={fieldErrors?.monthlyTakeHomeIncome}
                    aria-label="Monthly net (take-home) income in dollars"
                  />
                  <Input
                    id="otherMonthlyNeeds"
                    label={
                      <Tooltip content="Groceries, utilities, car payment, insurance, debt payments, etc." position="top" id="tooltip-other-needs">
                        <span>Other monthly needs ($)</span>
                      </Tooltip>
                    }
                    type="number"
                    min={0}
                    step={50}
                    value={inputValues.otherMonthlyNeeds}
                    onChange={(e) =>
                      setInputValues((v) => ({ ...v, otherMonthlyNeeds: e.target.value }))
                    }
                    onBlur={() => handleBlur("otherMonthlyNeeds")}
                    error={fieldErrors?.otherMonthlyNeeds}
                    aria-label="Other monthly needs in dollars"
                  />
                </div>
              </section>

              <div className="pt-4" ref={formActionsRef}>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    type="submit"
                    aria-describedby={error || fieldErrors?._form ? "form-errors" : undefined}
                  >
                    Calculate
                  </Button>
                  <Button type="button" variant="secondary" onClick={saveScenario}>
                    Save scenario
                  </Button>
                  <SavedScenariosDropdown
                    savedScenarios={savedScenarios}
                    onLoad={loadScenario}
                    onDelete={deleteScenario}
                  />
                </div>
              </div>
            </div>
          </Card>

          {homeRecommendation && (
            <ScenarioRecommendationCard
              homeRecommendation={homeRecommendation}
              estimatedGrossAnnual={
                parseFloat(inputValues.monthlyTakeHomeIncome || "0") * GROSS_FROM_TAKEHOME * 12
              }
            />
          )}
          {loadingRecommendation && (
            <Card>
              <p className="text-sm text-[var(--color-text-muted)]">Loading price recommendations…</p>
            </Card>
          )}

          {(error || fieldErrors?._form) && (
            <div id="form-errors" role="alert" aria-live="polite">
              <Card className="bg-[var(--warning-bg)]">
                <p className="text-[var(--color-text-primary)]">
                  {error ?? fieldErrors?._form}
                </p>
              </Card>
            </div>
          )}

          {result && (
            <>
              <p className="text-[15px] text-[var(--color-text-muted)]" role="status">
                Results reflect the scenario when you clicked Calculate. Edit inputs and calculate again to update.
              </p>
              <div
                className="mt-4 p-4 rounded-[var(--radius-input)] border flex flex-wrap items-center gap-3"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-input)" }}
              >
                <span className="text-sm font-medium text-[var(--color-text-muted)] w-full sm:w-auto">Next steps</span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setChatOpen(true)}
                  className="shrink-0"
                >
                  Ask Advisor about this scenario
                </Button>
                <Link
                  href={
                    homeRecommendation
                      ? `/search?minPrice=${Math.round(homeRecommendation.safe_min_price)}&maxPrice=${Math.round(homeRecommendation.safe_max_price)}`
                      : "/search"
                  }
                  className="inline-flex items-center justify-center h-11 min-w-[44px] rounded-[var(--radius-input)] px-5 text-sm font-medium border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-app)] no-underline"
                >
                  Search homes in this price range
                </Link>
              </div>

              <div className="grid gap-8 lg:grid-cols-2" style={{ marginTop: "var(--space-3)" }}>
                <ScenarioMonthlyCostCard piti={piti!} />
                <ScenarioAffordabilityCard affordability={affordability!} />

                {enhancedAnalysis?.risk_analysis && (
                  <RiskAnalysisCard riskAnalysis={enhancedAnalysis.risk_analysis} />
                )}

                {explain && result && affordability && (
                  <AIInsightsCard
                    explain={explain}
                    affordability={affordability}
                    onAskAdvisor={() => setChatOpen(true)}
                  />
                )}
                {loadingExplain && (
                  <p className="text-sm text-[var(--color-text-muted)] lg:col-span-2">Loading insights…</p>
                )}

                {enhancedAnalysis?.cost_breakdown && (
                  <CostBreakdownCard costBreakdown={enhancedAnalysis.cost_breakdown} />
                )}

                {enhancedAnalysis?.five_year_projection && (
                  <FiveYearProjectionCard fiveYearProjection={enhancedAnalysis.five_year_projection} />
                )}
              </div>

              {amortization && displaySchedule.length > 0 && (
                <AmortizationCard
                  monthlyPayment={amortization.monthlyPayment}
                  displaySchedule={displaySchedule}
                  showFullAmortization={showFullAmortization}
                  fullScheduleLength={fullSchedule?.length ?? 0}
                  interest5yr={interest5yr}
                  principal5yr={principal5yr}
                  page={page}
                  totalPages={totalPages}
                  rowsPerPage={ROWS_PER_PAGE}
                  pageRows={pageRows}
                  onShowFirst60={() => {
                    setShowFullAmortization(false);
                    setAmortizationPage(1);
                  }}
                  onShowFullTerm={showFullTerm}
                  onPrevPage={() => setAmortizationPage((p) => Math.max(1, p - 1))}
                  onNextPage={() => setAmortizationPage((p) => Math.min(totalPages, p + 1))}
                />
              )}
            </>
          )}
        </form>
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Advisor chat: solid card, collapsible (Ask Advisor button) */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
        {chatOpen && (
          <div
            className="w-[360px] sm:w-[400px] rounded-xl border shadow-[var(--shadow-card)] overflow-hidden"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-card)" }}
            role="dialog"
            aria-label="Advisor chat"
          >
            <AdvisorChat scenarioContext={scenarioContext} onClose={() => setChatOpen(false)} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setChatOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-opacity duration-150 hover:opacity-90 border"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-card)", color: "var(--color-text-primary)" }}
          aria-label={chatOpen ? "Close Advisor" : "Ask Advisor"}
        >
          {chatOpen ? "Close" : "Ask Advisor"}
        </button>
      </div>
    </div>
  );
}
