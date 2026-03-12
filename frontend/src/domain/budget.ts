/**
 * 50/30/20 affordability. Affordable = housing + other_needs <= 50% of income.
 */

import { roundToCents } from "./round";

export interface AffordabilitySummary {
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

export function calculateAffordability(
  monthlyTakeHomeIncome: number,
  monthlyHousingCost: number,
  otherMonthlyNeeds: number = 0
): AffordabilitySummary {
  if (!Number.isFinite(monthlyTakeHomeIncome) || monthlyTakeHomeIncome <= 0) {
    return {
      monthly_income: 0,
      needs_budget_50: 0,
      wants_budget_30: 0,
      savings_budget_20: 0,
      monthly_housing: monthlyHousingCost,
      other_needs: otherMonthlyNeeds,
      remaining_needs_after_housing: 0,
      housing_pct_of_income: 0,
      is_affordable: false,
      message: "Monthly income must be positive.",
    };
  }

  const needs_50 = roundToCents(monthlyTakeHomeIncome * 0.5);
  const wants_30 = roundToCents(monthlyTakeHomeIncome * 0.3);
  const savings_20 = roundToCents(monthlyTakeHomeIncome * 0.2);
  const totalNeedsUsed = roundToCents(monthlyHousingCost + otherMonthlyNeeds);
  const remainingNeeds = roundToCents(needs_50 - totalNeedsUsed);
  const housingPct = Math.round((monthlyHousingCost / monthlyTakeHomeIncome) * 1000) / 10; // 1 decimal precision for percentages
  const fits = totalNeedsUsed <= needs_50;

  return {
    monthly_income: monthlyTakeHomeIncome,
    needs_budget_50: needs_50,
    wants_budget_30: wants_30,
    savings_budget_20: savings_20,
    monthly_housing: monthlyHousingCost,
    other_needs: otherMonthlyNeeds,
    remaining_needs_after_housing: remainingNeeds,
    housing_pct_of_income: housingPct,
    is_affordable: fits,
    message: fits
      ? "Housing fits within the 50% needs budget."
      : "Housing plus other needs exceed the 50% needs budget.",
  };
}
