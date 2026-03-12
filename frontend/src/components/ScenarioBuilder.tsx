"use client";

import { useState, useEffect, useRef } from "react";
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
  fetchExplain,
  fetchHomeRecommendation,
  fetchEnhancedLoanAnalysis,
  type ExplainResponse,
  type HomeRecommendationResponse,
  type EnhancedLoanAnalysisResponse,
  type ScenarioContext,
} from "@/lib/api";
import { parseApiError } from "@/lib/validate";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ToastContainer } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { AdvisorChat } from "@/components/AdvisorChat";

const ROWS_PER_PAGE = 60;
/** Take-home to gross: we use gross = takeHome / 0.77 (≈23% effective tax). Same factor for API and display. */
const GROSS_FROM_TAKEHOME = 1 / 0.77;

/** Coerce API value (number or Decimal-as-string) to number for formatCurrency. */
function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

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
    setHovered({
      row,
      index: clamped,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseLeave = () => setHovered(null);

  const hoveredX = hovered
    ? (hovered.index / (schedule.length - 1)) * w
    : null;
  const hoveredY =
    hovered && range
      ? h - ((hovered.row.balance - minBalance) / range) * (h - 8) - 4
      : null;

  return (
    <div className="overflow-x-auto relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="min-h-[120px] w-full cursor-crosshair"
        aria-label="Remaining balance over time. Hover for month details."
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
            stroke="var(--color-surface)"
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
            backgroundColor: "#111827",
            borderColor: "rgba(0, 201, 255, 0.35)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(0, 201, 255, 0.15)",
          }}
          role="tooltip"
        >
          <div className="px-4 py-2.5 border-b border-[var(--color-border)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              Month {hovered.row.month}
            </span>
          </div>
          <div className="px-4 py-3 space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)]">Balance</span>
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums">{formatCurrency(hovered.row.balance)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)]">Principal</span>
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums">{formatCurrency(hovered.row.principal)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)]">Interest</span>
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums">{formatCurrency(hovered.row.interest)}</span>
            </div>
          </div>
        </div>
      )}
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
  
  // New state for advanced features
  const [homeRecommendation, setHomeRecommendation] = useState<HomeRecommendationResponse | null>(null);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedLoanAnalysisResponse | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<Array<{ name: string; scenario: Scenario }>>([]);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: "success" | "error" | "info" }>>([]);
  const [downPaymentMode, setDownPaymentMode] = useState<"dollar" | "percent">("dollar");
  const [chatOpen, setChatOpen] = useState(false);
  const formActionsRef = useRef<HTMLDivElement>(null);

  // Toast helper functions
  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Load saved scenarios from localStorage on mount
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

  // Fetch home price recommendation when income is entered
  useEffect(() => {
    const income = parseFloat(inputValues.monthlyTakeHomeIncome);
    if (income > 0) {
      setLoadingRecommendation(true);
      const grossIncome = income * GROSS_FROM_TAKEHOME;
      fetchHomeRecommendation({
        monthly_gross_income: grossIncome,
      })
        .then((data) => {
          setHomeRecommendation(data);
        })
        .catch((err) => {
          console.error("Failed to fetch home recommendation:", err);
        })
        .finally(() => {
          setLoadingRecommendation(false);
        });
    } else {
      setHomeRecommendation(null);
    }
  }, [inputValues.monthlyTakeHomeIncome]);

  const saveScenario = () => {
    const name = prompt("Enter a name for this scenario:");
    if (!name) return;
    
    const parsed = parseScenarioFromInputs(inputValues);
    const validation = validateScenario(parsed);
    if (validation) {
      addToast("Please fix validation errors before saving.", "error");
      return;
    }

    const newScenarios = [...savedScenarios, { name, scenario: parsed }];
    setSavedScenarios(newScenarios);
    localStorage.setItem("homepilot_scenarios", JSON.stringify(newScenarios));
    addToast(`Scenario "${name}" saved successfully!`, "success");
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

  return (
    <div className="relative z-10">
      <main className="py-6 sm:py-8 pb-12">
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

              <div className="pt-2" ref={formActionsRef}>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    type="submit"
                    aria-describedby={error || fieldErrors?._form ? "form-errors" : undefined}
                  >
                    Calculate affordability
                  </Button>
                  <Button type="button" variant="secondary" onClick={saveScenario}>
                    💾 Save Scenario
                  </Button>
                  {savedScenarios.length > 0 && (
                    <div className="flex-1 min-w-[200px]">
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-[var(--color-primary)] hover:underline">
                          📂 Load Saved ({savedScenarios.length})
                        </summary>
                        <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3" style={{ borderColor: "var(--color-border)" }}>
                          {savedScenarios.map((saved, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                              <button
                                type="button"
                                className="flex-1 text-left hover:underline text-[var(--color-primary)]"
                                onClick={() => loadScenario(saved.scenario, saved.name)}
                              >
                                {saved.name}
                              </button>
                              <button
                                type="button"
                                className="text-[var(--color-danger)] hover:underline"
                                onClick={() => {
                                  if (confirm(`Delete "${saved.name}"?`)) {
                                    deleteScenario(idx, saved.name);
                                  }
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Home Price Recommendation */}
          {homeRecommendation && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended Home Price Range</CardTitle>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Estimated gross income: {formatCurrency(parseFloat(inputValues.monthlyTakeHomeIncome || "0") * GROSS_FROM_TAKEHOME * 12)}/year
                  <span className="text-xs block mt-1">(Take-home ÷ 0.77 ≈ 23% effective tax. Recommended price is 28% of that gross.)</span>
                </p>
              </CardHeader>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)" }}>
                    <p className="text-sm text-[var(--color-text-muted)]">Recommended Price</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--color-success)]">
                      {formatCurrency(homeRecommendation.recommended_price)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">28% of estimated gross income</p>
                  </div>
                  <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)" }}>
                    <p className="text-sm text-[var(--color-text-muted)]">Maximum Price</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                      {formatCurrency(homeRecommendation.maximum_price)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">35% of estimated gross income</p>
                  </div>
                </div>
                <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--primary-light)" }}>
                  <p className="text-sm font-medium text-[var(--color-primary)]">Safe Range</p>
                  <p className="mt-2 text-lg">
                    {formatCurrency(homeRecommendation.safe_min_price)} – {formatCurrency(homeRecommendation.safe_max_price)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Keeps housing costs between 25–30% of income for financial flexibility.
                  </p>
                </div>
              </div>
            </Card>
          )}
          {loadingRecommendation && (
            <Card>
              <p className="text-sm text-[var(--color-text-muted)]">Loading recommendations…</p>
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
                Results are for the scenario at the time you clicked Calculate. Edit inputs and
                click Calculate again to update.
              </p>

              <div className="grid gap-8 lg:grid-cols-2" style={{ marginTop: "var(--space-3)" }}>
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

                {/* Risk Analysis */}
                {enhancedAnalysis?.risk_analysis && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Financial risk indicators</CardTitle>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Industry-standard thresholds for safe home financing
                      </p>
                    </CardHeader>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {enhancedAnalysis.risk_analysis.indicators.map((indicator, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between rounded-lg border p-3"
                          style={{
                            borderColor: indicator.level === "safe" ? "var(--color-success)" : 
                                        indicator.level === "moderate" ? "var(--color-warning)" : 
                                        "var(--color-danger)",
                            backgroundColor: indicator.level === "safe" ? "rgba(46, 184, 92, 0.05)" : 
                                            indicator.level === "moderate" ? "rgba(251, 191, 36, 0.05)" : 
                                            "rgba(239, 68, 68, 0.05)",
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{indicator.message}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">Target: ≤{indicator.threshold}%</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs">
                              {indicator.level === "safe" ? "✅ Safe" : 
                              indicator.level === "moderate" ? "🟡 Moderate" : 
                              "⚠️ High Risk"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {enhancedAnalysis.risk_analysis.warnings.length > 0 && (
                      <div className="mt-4 rounded-lg border p-4" style={{ 
                        borderColor: "var(--color-warning)", 
                        backgroundColor: "rgba(251, 191, 36, 0.05)" 
                      }}>
                        <p className="font-medium text-[var(--color-warning)]">⚠️ Risk Warnings:</p>
                        <ul className="mt-2 space-y-1">
                          {enhancedAnalysis.risk_analysis.warnings.map((warning, i) => (
                            <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                              • {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {enhancedAnalysis.risk_analysis.strengths.length > 0 && (
                      <div className="mt-4 rounded-lg border p-4" style={{ 
                        borderColor: "var(--color-success)", 
                        backgroundColor: "rgba(46, 184, 92, 0.05)" 
                      }}>
                        <p className="font-medium text-[var(--color-success)]">✅ Financial Strengths:</p>
                        <ul className="mt-2 space-y-1">
                          {enhancedAnalysis.risk_analysis.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )}

                {/* Single AI insights section: summary, recommendations, one callout, Ask advisor */}
                {explain && result && (
                  <Card className="lg:col-span-2 ring-1 ring-[var(--color-primary)]/10">
                    <CardHeader>
                      <CardTitle className="text-[var(--color-text-primary)]">
                        AI insights
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-5">
                      {explain.summary && (
                        <p className="text-[var(--color-text-primary)] font-medium leading-snug">
                          {explain.summary}
                        </p>
                      )}
                      {explain.narrative && (
                        <div className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed space-y-2">
                          {explain.narrative
                            .split(/\n\n+/)
                            .filter((p) => p.trim())
                            .slice(0, 2)
                            .map((para, i) => (
                              <p key={i}>{para.trim()}</p>
                            ))}
                        </div>
                      )}
                      {affordability && affordability.remaining_needs_after_housing < 500 && affordability.remaining_needs_after_housing >= 0 && (
                        <div
                          className="rounded-lg border px-4 py-3"
                          style={{ borderColor: "var(--color-warning)", backgroundColor: "var(--warning-bg)" }}
                        >
                          <p className="text-sm font-medium text-[var(--color-warning)]">
                            Low buffer: {formatCurrency(affordability.remaining_needs_after_housing)} left in needs budget after housing. Consider a lower price or higher income buffer.
                          </p>
                        </div>
                      )}
                      {explain.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                            Recommendations
                          </p>
                          <ul className="space-y-2">
                            {explain.suggestions.slice(0, 5).map((s, i) => (
                              <li key={i} className="flex items-start gap-3 text-[15px] text-[var(--color-text-secondary)]">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setChatOpen(true)}
                        aria-label="Open advisor chat"
                      >
                        Ask advisor
                      </Button>
                    </div>
                  </Card>
                )}
                {loadingExplain && (
                  <p className="text-sm text-[var(--color-text-muted)] lg:col-span-2">Loading summary…</p>
                )}

                {/* Cost Breakdown Chart */}
                {enhancedAnalysis?.cost_breakdown && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cost breakdown</CardTitle>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Monthly housing cost distribution
                      </p>
                    </CardHeader>
                    <div className="space-y-4">
                      {[
                        { label: "Principal & Interest", amount: enhancedAnalysis.cost_breakdown.principal_and_interest, color: "var(--color-primary)" },
                        { label: "Property Tax", amount: enhancedAnalysis.cost_breakdown.property_tax, color: "rgb(59, 130, 246)" },
                        { label: "Insurance", amount: enhancedAnalysis.cost_breakdown.insurance, color: "rgb(16, 185, 129)" },
                        { label: "PMI", amount: enhancedAnalysis.cost_breakdown.pmi, color: "rgb(251, 191, 36)" },
                        { label: "HOA", amount: enhancedAnalysis.cost_breakdown.hoa, color: "rgb(168, 85, 247)" },
                        { label: "Maintenance", amount: enhancedAnalysis.cost_breakdown.maintenance, color: "rgb(239, 68, 68)" },
                      ].filter(item => item.amount > 0).map((item) => {
                        const percentage = (item.amount / enhancedAnalysis.cost_breakdown.total) * 100;
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-[var(--color-text-muted)]">{item.label}</span>
                                <span className="font-medium">{formatCurrency(item.amount)} ({percentage.toFixed(1)}%)</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                                <div
                                  className="h-full rounded-full transition-[width] duration-500"
                                  style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-3 border-t flex justify-between font-semibold" style={{ borderColor: "var(--color-border)" }}>
                        <span>Total Monthly</span>
                        <span className="text-[var(--color-primary)]">{formatCurrency(enhancedAnalysis.cost_breakdown.total)}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* 5-Year Projection */}
                {enhancedAnalysis?.five_year_projection && (() => {
                  const proj = enhancedAnalysis.five_year_projection;
                  const projectedHomeValue = toNum(proj.projected_home_value);
                  const projectedEquity = toNum(proj.projected_equity);
                  const netWorthChange = toNum(proj.net_worth_change);
                  const annualRate = toNum(proj.annual_appreciation_rate);
                  const totalPayments = toNum(proj.total_payments);
                  const totalInterest = toNum(proj.total_interest_paid);
                  const yearlyDetails = Array.isArray(proj.yearly_details) ? proj.yearly_details : [];
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
                            {yearlyDetails.map((year: { year?: number; equity?: unknown }, idx: number) => {
                              const eq = toNum(year.equity);
                              const pct = projectedEquity > 0 ? (eq / projectedEquity) * 100 : 0;
                              return (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                  <span className="w-16 text-[var(--color-text-muted)]">Year {year.year ?? idx + 1}</span>
                                  <div className="flex-1 flex items-center gap-2">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${pct}%`,
                                          backgroundColor: "var(--color-success)",
                                        }}
                                      />
                                    </div>
                                    <span className="w-24 text-right font-medium">
                                      {formatCurrency(eq)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-3 rounded-lg border p-3 text-xs text-[var(--color-text-muted)]" style={{ 
                          borderColor: "var(--color-border)", 
                          backgroundColor: "var(--primary-light)" 
                        }}>
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
                })()}
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Advisor chat: solid card, collapsible (Ask Advisor button) */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
        {chatOpen && (
          <div
            className="w-[360px] sm:w-[400px] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
            role="dialog"
            aria-label="Advisor chat"
          >
            <AdvisorChat scenarioContext={scenarioContext} onClose={() => setChatOpen(false)} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setChatOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl px-4 py-3 bg-white border border-gray-200 shadow-md font-medium text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-shadow"
          aria-label={chatOpen ? "Close advisor chat" : "Ask advisor"}
        >
          {chatOpen ? "Close" : "💬 Ask Advisor"}
        </button>
      </div>
    </div>
  );
}
