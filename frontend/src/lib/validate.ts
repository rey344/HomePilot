import type { LoanTerms } from "./api";

export type FieldErrors = Partial<Record<keyof LoanTerms | "_form", string>>;

export function validateScenario(terms: LoanTerms): FieldErrors | null {
  const err: FieldErrors = {};

  if (terms.home_value <= 0) {
    err.home_value = "Home value must be greater than 0.";
  }
  if (terms.down_payment < 0) {
    err.down_payment = "Down payment cannot be negative.";
  }
  if (terms.down_payment >= terms.home_value) {
    err.down_payment = "Down payment must be less than home value.";
  }
  if (terms.annual_rate_pct < 0 || terms.annual_rate_pct > 30) {
    err.annual_rate_pct = "Interest rate must be between 0% and 30%.";
  }
  if (!Number.isInteger(terms.term_years) || terms.term_years < 1 || terms.term_years > 30) {
    err.term_years = "Loan term must be between 1 and 30 years.";
  }
  if (terms.monthly_take_home_income <= 0) {
    err.monthly_take_home_income = "Monthly take-home income must be greater than 0.";
  }
  if (terms.other_monthly_needs != null && terms.other_monthly_needs < 0) {
    err.other_monthly_needs = "Other monthly needs cannot be negative.";
  }

  if (Object.keys(err).length === 0) return null;
  return err;
}

/** Parse API 422/400 into a user-friendly message */
export function parseApiError(err: unknown): string {
  if (err instanceof Error && err.message) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed.detail) {
        if (Array.isArray(parsed.detail)) {
          const first = parsed.detail[0];
          return first?.msg ?? first?.loc?.join(" ") ?? err.message;
        }
        return typeof parsed.detail === "string" ? parsed.detail : err.message;
      }
    } catch {
      // not JSON
    }
    return err.message;
  }
  return "Something went wrong. Please check your entries and try again.";
}
