/**
 * Strict validation for scenario. No silent coercion; show errors.
 */

export interface ScenarioInput {
  homeValue: number;
  downPayment: number;
  annualRatePercent: number;
  termYears: number;
  monthlyTakeHomeIncome: number;
  otherMonthlyNeeds?: number;
}

export type FieldErrors = Partial<Record<keyof ScenarioInput | "_form", string>>;

export function validateScenario(s: ScenarioInput): FieldErrors | null {
  const err: FieldErrors = {};

  if (typeof s.homeValue !== "number" || !Number.isFinite(s.homeValue) || s.homeValue <= 0) {
    err.homeValue = "Home value must be greater than 0.";
  }
  if (typeof s.downPayment !== "number" || !Number.isFinite(s.downPayment) || s.downPayment < 0) {
    err.downPayment = "Down payment must be ≥ 0.";
  }
  if (
    Number.isFinite(s.homeValue) &&
    Number.isFinite(s.downPayment) &&
    s.downPayment >= s.homeValue
  ) {
    err.downPayment = "Down payment must be less than home value.";
  }
  if (
    typeof s.annualRatePercent !== "number" ||
    !Number.isFinite(s.annualRatePercent) ||
    s.annualRatePercent < 0 ||
    s.annualRatePercent > 30
  ) {
    err.annualRatePercent = "Interest rate must be between 0 and 30%.";
  }
  if (
    typeof s.termYears !== "number" ||
    !Number.isInteger(s.termYears) ||
    s.termYears < 1 ||
    s.termYears > 30
  ) {
    err.termYears = "Loan term must be a whole number between 1 and 30 years.";
  }
  if (
    typeof s.monthlyTakeHomeIncome !== "number" ||
    !Number.isFinite(s.monthlyTakeHomeIncome) ||
    s.monthlyTakeHomeIncome <= 0
  ) {
    err.monthlyTakeHomeIncome = "Monthly take-home income must be greater than 0.";
  }
  if (
    s.otherMonthlyNeeds != null &&
    (typeof s.otherMonthlyNeeds !== "number" ||
      !Number.isFinite(s.otherMonthlyNeeds) ||
      s.otherMonthlyNeeds < 0)
  ) {
    err.otherMonthlyNeeds = "Other monthly needs cannot be negative.";
  }

  if (Object.keys(err).length === 0) return null;
  return err;
}
