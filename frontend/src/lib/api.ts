const getBase = () =>
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:9001")
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:9001";

const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Fetch with timeout
function fetchWithTimeout(url: string, options: RequestInit, timeout = DEFAULT_TIMEOUT): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
}

export interface LoanTerms {
  name?: string;
  home_value: number;
  down_payment: number;
  annual_rate_pct: number;
  term_years: number;
  annual_property_tax_pct: number;
  annual_insurance_pct: number;
  hoa_monthly?: number;
  maintenance_monthly_pct?: number;
  monthly_take_home_income: number;
  other_monthly_needs?: number;
}

export interface PitiResponse {
  principal_and_interest: number;
  property_tax_monthly: number;
  insurance_monthly: number;
  piti_total: number;
  pmi_monthly: number;
  hoa_monthly: number;
  maintenance_monthly: number;
  total_monthly: number;
}

export interface AffordabilityResponse {
  monthly_income: number;
  needs_budget_50: number;
  wants_budget_30: number;
  savings_budget_20: number;
  monthly_housing: number;
  other_needs: number;
  remaining_needs_after_housing: number;
  housing_pct_of_income: number;
  is_affordable: boolean;
  message: string;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface AmortizationResponse {
  monthly_payment: number;
  schedule: AmortizationRow[];
  total_months: number;
}

export interface ExplainResponse {
  narrative: string;
  suggestions: string[];
}

export async function fetchExplain(
  monthlyIncome: number,
  monthlyHousing: number,
  otherNeeds: number,
  isAffordable: boolean,
  housingPctOfIncome: number,
  needsBudget50: number,
  remainingNeedsAfterHousing: number,
  pmiMonthly: number = 0,
  termYears: number = 30
): Promise<ExplainResponse> {
  const res = await fetchWithTimeout(`${getBase()}/api/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      monthly_income: monthlyIncome,
      monthly_housing: monthlyHousing,
      other_needs: otherNeeds,
      is_affordable: isAffordable,
      housing_pct_of_income: housingPctOfIncome,
      needs_budget_50: needsBudget50,
      remaining_needs_after_housing: remainingNeedsAfterHousing,
      pmi_monthly: pmiMonthly,
      term_years: termYears,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  return 0;
}

export async function fetchPiti(terms: LoanTerms): Promise<PitiResponse> {
  const res = await fetchWithTimeout(`${getBase()}/api/calc/piti`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: terms.name ?? "Untitled scenario",
      home_value: terms.home_value,
      down_payment: terms.down_payment,
      annual_rate_pct: terms.annual_rate_pct,
      term_years: terms.term_years,
      annual_property_tax_pct: terms.annual_property_tax_pct,
      annual_insurance_pct: terms.annual_insurance_pct,
      hoa_monthly: terms.hoa_monthly ?? 0,
      maintenance_monthly_pct: terms.maintenance_monthly_pct ?? 0.1,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    principal_and_interest: num(data.principal_and_interest),
    property_tax_monthly: num(data.property_tax_monthly),
    insurance_monthly: num(data.insurance_monthly),
    piti_total: num(data.piti_total),
    pmi_monthly: num(data.pmi_monthly),
    hoa_monthly: num(data.hoa_monthly),
    maintenance_monthly: num(data.maintenance_monthly),
    total_monthly: num(data.total_monthly),
  };
}

export async function fetchAffordability(
  monthlyHousing: number,
  monthlyIncome: number,
  otherNeeds: number = 0
): Promise<AffordabilityResponse> {
  const res = await fetchWithTimeout(`${getBase()}/api/profile/affordability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      monthly_take_home_income: monthlyIncome,
      monthly_housing_cost: monthlyHousing,
      other_monthly_needs: otherNeeds,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    ...data,
    monthly_income: num(data.monthly_income),
    needs_budget_50: num(data.needs_budget_50),
    wants_budget_30: num(data.wants_budget_30),
    savings_budget_20: num(data.savings_budget_20),
    monthly_housing: num(data.monthly_housing),
    other_needs: num(data.other_needs),
    remaining_needs_after_housing: num(data.remaining_needs_after_housing),
    housing_pct_of_income: num(data.housing_pct_of_income),
    is_affordable: Boolean(data.is_affordable),
  };
}

export async function fetchAmortization(terms: LoanTerms, maxMonths = 120): Promise<AmortizationResponse> {
  const res = await fetchWithTimeout(
    `${getBase()}/api/calc/amortization?max_months=${maxMonths}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        home_value: terms.home_value,
        down_payment: terms.down_payment,
        annual_rate_pct: terms.annual_rate_pct,
        term_years: terms.term_years,
        annual_property_tax_pct: terms.annual_property_tax_pct,
        annual_insurance_pct: terms.annual_insurance_pct,
        hoa_monthly: terms.hoa_monthly ?? 0,
        maintenance_monthly_pct: terms.maintenance_monthly_pct ?? 0.1,
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    monthly_payment: num(data.monthly_payment),
    total_months: Number(data.total_months),
    schedule: (data.schedule || []).map((r: Record<string, unknown>) => ({
      month: Number(r.month),
      payment: num(r.payment),
      principal: num(r.principal),
      interest: num(r.interest),
      balance: num(r.balance),
    })),
  };
}
