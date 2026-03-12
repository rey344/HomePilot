/**
 * Single source of truth: Scenario (inputs) → Result (all derived outputs).
 * All computations are pure and deterministic.
 */

import { calculateAffordability, type AffordabilitySummary } from "./budget";
import {
  amortizationSchedule,
  calculateLoanAmount,
  calculateMonthlyInsurance,
  calculateMonthlyMaintenance,
  calculateMonthlyPI,
  calculateMonthlyPMI,
  calculateMonthlyPropertyTax,
  type AmortizationRow,
} from "./mortgage";
import { roundToCents } from "./round";

export type Scenario = {
  homeValue: number;
  downPayment: number;
  annualRatePercent: number;
  termYears: number;
  annualPropertyTaxPercent: number;
  annualInsurancePercent: number;
  hoaMonthly: number;
  annualMaintenancePercent: number;
  monthlyTakeHomeIncome: number;
  otherMonthlyNeeds: number;
};

export interface PitiBreakdown {
  principalAndInterest: number;
  propertyTaxMonthly: number;
  insuranceMonthly: number;
  pitiTotal: number;
  pmiMonthly: number;
  hoaMonthly: number;
  maintenanceMonthly: number;
  totalMonthly: number;
}

export interface AmortizationResult {
  monthlyPayment: number;
  schedule: AmortizationRow[];
  totalMonths: number;
}

export interface AffordabilityResult {
  piti: PitiBreakdown;
  affordability: AffordabilitySummary;
  amortization: AmortizationResult;
}

const DEFAULT_AMORTIZATION_MONTHS = 60;

/**
 * Compute all derived outputs from one scenario. Single pipeline; no inconsistent state.
 */
export function calculateAffordabilitySummary(
  scenario: Scenario,
  amortizationMaxMonths: number = DEFAULT_AMORTIZATION_MONTHS
): AffordabilityResult {
  const loanAmount = calculateLoanAmount(scenario.homeValue, scenario.downPayment);
  const pi = calculateMonthlyPI(loanAmount, scenario.annualRatePercent, scenario.termYears);
  const tax = calculateMonthlyPropertyTax(scenario.homeValue, scenario.annualPropertyTaxPercent);
  const insurance = calculateMonthlyInsurance(scenario.homeValue, scenario.annualInsurancePercent);
  const pitiTotal = roundToCents(pi + tax + insurance);
  const pmi = calculateMonthlyPMI(loanAmount, scenario.homeValue);
  const maintenance = calculateMonthlyMaintenance(scenario.homeValue, scenario.annualMaintenancePercent);
  const totalMonthly = roundToCents(pitiTotal + pmi + scenario.hoaMonthly + maintenance);

  const piti: PitiBreakdown = {
    principalAndInterest: pi,
    propertyTaxMonthly: tax,
    insuranceMonthly: insurance,
    pitiTotal,
    pmiMonthly: pmi,
    hoaMonthly: scenario.hoaMonthly,
    maintenanceMonthly: maintenance,
    totalMonthly,
  };

  const affordability = calculateAffordability(
    scenario.monthlyTakeHomeIncome,
    totalMonthly,
    scenario.otherMonthlyNeeds
  );

  const schedule = amortizationSchedule(
    loanAmount,
    scenario.annualRatePercent,
    scenario.termYears,
    amortizationMaxMonths
  );
  const amortization: AmortizationResult = {
    monthlyPayment: pi,
    schedule,
    totalMonths: schedule.length,
  };

  return { piti, affordability, amortization };
}

export { formatCurrency, roundToCents } from "./round";
export {
  amortizationSchedule,
  calculateLoanAmount,
  calculateMonthlyPI,
  calculateMonthlyPMI,
} from "./mortgage";
export type { AmortizationRow } from "./mortgage";
export type { AffordabilitySummary } from "./budget";
export { validateScenario, type FieldErrors } from "./validate";
