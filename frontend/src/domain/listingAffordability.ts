/**
 * Shared affordability logic for listing evaluation (Search Homes).
 * Reuses the same mortgage + 50/30/20 logic as the calculator so results are consistent.
 */

import { calculateAffordability, type AffordabilitySummary } from "./budget";
import {
  calculateLoanAmount,
  calculateMonthlyInsurance,
  calculateMonthlyMaintenance,
  calculateMonthlyPI,
  calculateMonthlyPMI,
  calculateMonthlyPropertyTax,
} from "./mortgage";

export interface ListingBudgetInputs {
  price: number;
  downPaymentPct: number;
  interestRatePct: number;
  termYears?: number;
  propertyTaxPct?: number;
  insurancePct?: number;
  hoaMonthly?: number;
  maintenancePct?: number;
  monthlyTakeHomeIncome: number;
  otherMonthlyNeeds?: number;
}

const DEFAULT_TERM_YEARS = 30;
const DEFAULT_INSURANCE_PCT = 0.35;
const DEFAULT_MAINTENANCE_PCT = 0.5;

export interface ListingAffordabilityResult {
  totalMonthly: number;
  pAndI: number;
  propertyTax: number;
  insurance: number;
  pmi: number;
  hoa: number;
  maintenance: number;
  affordability: AffordabilitySummary;
}

/**
 * Compute full monthly housing cost and 50/30/20 affordability for a listing price.
 * Uses the same formulas as the calculator (P&I, tax, insurance, PMI, HOA, maintenance).
 */
export function computeListingAffordability(
  inputs: ListingBudgetInputs
): ListingAffordabilityResult {
  const {
    price,
    downPaymentPct,
    interestRatePct,
    termYears = DEFAULT_TERM_YEARS,
    propertyTaxPct = 0,
    insurancePct = DEFAULT_INSURANCE_PCT,
    hoaMonthly = 0,
    maintenancePct = DEFAULT_MAINTENANCE_PCT,
    monthlyTakeHomeIncome,
    otherMonthlyNeeds = 0,
  } = inputs;

  const downPayment = price * (downPaymentPct / 100);
  const loanAmount = calculateLoanAmount(price, downPayment);
  const pAndI = calculateMonthlyPI(loanAmount, interestRatePct, termYears);
  const propertyTax = calculateMonthlyPropertyTax(price, propertyTaxPct);
  const insurance = calculateMonthlyInsurance(price, insurancePct);
  const pmi = calculateMonthlyPMI(loanAmount, price);
  const maintenance = calculateMonthlyMaintenance(price, maintenancePct);
  const totalMonthly = pAndI + propertyTax + insurance + pmi + hoaMonthly + maintenance;

  const affordability = calculateAffordability(
    monthlyTakeHomeIncome,
    totalMonthly,
    otherMonthlyNeeds
  );

  return {
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    pAndI,
    propertyTax,
    insurance,
    pmi,
    hoa: hoaMonthly,
    maintenance,
    affordability,
  };
}
