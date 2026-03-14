/**
 * Scenario form state helpers: string inputs ↔ Scenario (numbers).
 * Keeps form layer separate from domain Scenario type.
 */

import type { Scenario } from "@/domain";

/** Raw string state for inputs — no coercion; allows empty and typing. */
export type InputValues = Record<keyof Scenario, string>;

export const defaultScenario: Scenario = {
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

export function inputValuesFromScenario(s: Scenario): InputValues {
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
export function parseScenarioFromInputs(inputs: InputValues): Scenario {
  const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
  return {
    homeValue: num(inputs.homeValue),
    downPayment: num(inputs.downPayment),
    annualRatePercent: num(inputs.annualRatePercent),
    termYears: num(inputs.termYears),
    annualPropertyTaxPercent: num(inputs.annualPropertyTaxPercent),
    annualInsurancePercent: num(inputs.annualInsurancePercent),
    hoaMonthly: num(inputs.hoaMonthly),
    annualMaintenancePercent: num(inputs.annualMaintenancePercent),
    monthlyTakeHomeIncome: num(inputs.monthlyTakeHomeIncome),
    otherMonthlyNeeds: num(inputs.otherMonthlyNeeds),
  };
}
