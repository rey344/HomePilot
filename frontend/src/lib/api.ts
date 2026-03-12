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

export interface PropertyListing {
  property_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number;
  property_type?: string;
  listing_url?: string;
  image_url?: string;
  description?: string;
}

export interface AffordabilityIndicator {
  status: string;
  monthly_payment: number;
  housing_pct_of_income: number;
  is_affordable: boolean;
  message: string;
}

export interface HomeRecommendationRequest {
  monthly_gross_income: number;
  monthly_debt_payments?: number;
  down_payment_pct?: number;
  interest_rate?: number;
  term_years?: number;
  property_tax_rate?: number;
  insurance_pct?: number;
  hoa_monthly?: number;
}

export interface HomeRecommendationResponse {
  recommended_price: number;
  maximum_price: number;
  safe_min_price: number;
  safe_max_price: number;
  monthly_payment_at_recommended: number;
  monthly_payment_at_maximum: number;
  assumptions: {
    interest_rate_pct: number;
    down_payment_pct: number;
    term_years: number;
    property_tax_pct: number;
    insurance_pct: number;
    hoa_monthly: number;
  };
}

export interface RiskIndicator {
  level: string;
  message: string;
  value: number;
  threshold: number;
}

export interface RiskAnalysis {
  overall_risk: string;
  indicators: RiskIndicator[];
  warnings: string[];
  strengths: string[];
}

export interface YearProjection {
  year: number;
  home_value: number;
  loan_balance: number;
  equity: number;
  cumulative_interest_paid: number;
  cumulative_principal_paid: number;
}

export interface FiveYearProjection {
  initial_home_value: number;
  projected_home_value: number;
  home_value_increase: number;
  home_value_increase_pct: number;
  initial_loan_balance: number;
  projected_loan_balance: number;
  principal_paid: number;
  initial_equity: number;
  projected_equity: number;
  equity_increase: number;
  total_interest_paid: number;
  total_payments: number;
  net_worth_change: number;
  annual_appreciation_rate: number;
  yearly_details: YearProjection[];
}

export interface CostBreakdown {
  principal_and_interest: number;
  property_tax: number;
  insurance: number;
  pmi: number;
  hoa: number;
  maintenance: number;
  total: number;
}

export interface EnhancedLoanAnalysisResponse {
  cost_breakdown: CostBreakdown;
  risk_analysis: RiskAnalysis;
  five_year_projection: FiveYearProjection;
  affordability: {
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
  };
}

export interface HomeRecommendationRequest {
  monthly_gross_income: number;
  monthly_debt_payments?: number;
  down_payment_pct?: number;
  interest_rate?: number;
  term_years?: number;
  property_tax_rate?: number;
  insurance_pct?: number;
  hoa_monthly?: number;
}

export interface HomeRecommendationResponse {
  recommended_price: number;
  maximum_price: number;
  safe_min_price: number;
  safe_max_price: number;
  monthly_payment_at_recommended: number;
  monthly_payment_at_maximum: number;
  assumptions: {
    interest_rate_pct: number;
    down_payment_pct: number;
    term_years: number;
    property_tax_pct: number;
    insurance_pct: number;
    hoa_monthly: number;
  };
}

export interface ListingWithAffordability {
  listing: PropertyListing;
  affordability: AffordabilityIndicator;
}

export interface RealEstateSearchResponse {
  listings: ListingWithAffordability[];
  total_found: number;
  search_location: string;
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
  const res = await fetchWithTimeout(`${getBase()}/api/v1/ai/explain`, {
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
  const res = await fetchWithTimeout(`${getBase()}/api/v1/calc/piti`, {
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
  const res = await fetchWithTimeout(`${getBase()}/api/v1/profile/affordability`, {
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
    message: String((data as any).message ?? ""),
  };
}

export async function fetchHomeRecommendation(
  request: HomeRecommendationRequest
): Promise<HomeRecommendationResponse> {
  const res = await fetchWithTimeout(`${getBase()}/api/v1/profile/recommend-home-price`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      monthly_gross_income: request.monthly_gross_income,
      monthly_debt_payments: request.monthly_debt_payments ?? 0,
      down_payment_pct: request.down_payment_pct ?? 20,
      interest_rate: request.interest_rate ?? 6.5,
      term_years: request.term_years ?? 30,
      property_tax_rate: request.property_tax_rate ?? 1.2,
      insurance_pct: request.insurance_pct ?? 0.35,
      hoa_monthly: request.hoa_monthly ?? 0,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    recommended_price: num(data.recommended_price),
    maximum_price: num(data.maximum_price),
    safe_min_price: num(data.safe_min_price),
    safe_max_price: num(data.safe_max_price),
    monthly_payment_at_recommended: num(data.monthly_payment_at_recommended),
    monthly_payment_at_maximum: num(data.monthly_payment_at_maximum),
    assumptions: data.assumptions,
  };
}

export async function searchRealEstate(
  location: string,
  maxPrice: number,
  minPrice?: number,
  bedrooms?: number,
  bathrooms?: number,
  limit: number = 20
): Promise<RealEstateSearchResponse> {
  const res = await fetchWithTimeout(`${getBase()}/api/v1/real-estate/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location,
      max_price: maxPrice,
      min_price: minPrice,
      bedrooms,
      bathrooms,
      limit,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function searchRealEstateWithProfile(
  location: string,
  maxPrice: number,
  monthlyIncome: number,
  annualIncome: number,
  downPaymentPct: number = 20.0,
  interestRate: number = 6.5,
  termYears: number = 30,
  propertyTaxRate: number = 1.2,
  insuranceAnnual: number = 1200.0,
  hoaMonthly: number = 0.0,
  minPrice?: number,
  bedrooms?: number,
  bathrooms?: number,
  limit: number = 20
): Promise<RealEstateSearchResponse> {
  const res = await fetchWithTimeout(
    `${getBase()}/api/v1/real-estate/search-with-profile?` +
      `monthly_income=${monthlyIncome}&` +
      `annual_income=${annualIncome}&` +
      `down_payment_pct=${downPaymentPct}&` +
      `interest_rate=${interestRate}&` +
      `term_years=${termYears}&` +
      `property_tax_rate=${propertyTaxRate}&` +
      `insurance_annual=${insuranceAnnual}&` +
      `hoa_monthly=${hoaMonthly}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location,
        max_price: maxPrice,
        min_price: minPrice,
        bedrooms,
        bathrooms,
        limit,
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAmortization(terms: LoanTerms, maxMonths = 120): Promise<AmortizationResponse> {
  const res = await fetchWithTimeout(
    `${getBase()}/api/v1/calc/amortization?max_months=${maxMonths}`,
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

export interface EnhancedLoanAnalysisRequest {
  home_value: number;
  down_payment: number;
  annual_rate_pct: number;
  term_years: number;
  annual_property_tax_pct: number;
  annual_insurance_pct: number;
  hoa_monthly?: number;
  maintenance_monthly_pct?: number;
  monthly_gross_income: number;
  monthly_take_home_income: number;
  monthly_debt_payments?: number;
  other_monthly_needs?: number;
}

export async function fetchEnhancedLoanAnalysis(
  request: EnhancedLoanAnalysisRequest
): Promise<EnhancedLoanAnalysisResponse> {
  const res = await fetchWithTimeout(`${getBase()}/api/v1/calc/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      home_value: request.home_value,
      down_payment: request.down_payment,
      annual_rate_pct: request.annual_rate_pct,
      term_years: request.term_years,
      annual_property_tax_pct: request.annual_property_tax_pct,
      annual_insurance_pct: request.annual_insurance_pct,
      hoa_monthly: request.hoa_monthly ?? 0,
      maintenance_monthly_pct: request.maintenance_monthly_pct ?? 0.1,
      monthly_gross_income: request.monthly_gross_income,
      monthly_take_home_income: request.monthly_take_home_income,
      monthly_debt_payments: request.monthly_debt_payments ?? 0,
      other_monthly_needs: request.other_monthly_needs ?? 0,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
