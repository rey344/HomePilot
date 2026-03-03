/**
 * Pure mortgage calculations. All amounts rounded to cents.
 */

import { roundToCents } from "./round";

export function calculateLoanAmount(homeValue: number, downPayment: number): number {
  if (!Number.isFinite(homeValue) || !Number.isFinite(downPayment) || homeValue <= 0) return 0;
  return roundToCents(Math.max(0, homeValue - downPayment));
}

export function calculateMonthlyPI(
  loanAmount: number,
  annualRatePercent: number,
  termYears: number
): number {
  if (loanAmount <= 0 || termYears < 1 || !Number.isFinite(loanAmount) || !Number.isFinite(annualRatePercent)) {
    return 0;
  }
  const n = termYears * 12;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return roundToCents(loanAmount / n);
  const onePlusR = 1 + r;
  const factor = (r * Math.pow(onePlusR, n)) / (Math.pow(onePlusR, n) - 1);
  return roundToCents(loanAmount * factor);
}

export function calculateMonthlyPropertyTax(homeValue: number, annualTaxRatePercent: number): number {
  if (!Number.isFinite(homeValue) || homeValue <= 0 || !Number.isFinite(annualTaxRatePercent)) return 0;
  return roundToCents((homeValue * (annualTaxRatePercent / 100)) / 12);
}

export function calculateMonthlyInsurance(homeValue: number, annualInsuranceRatePercent: number): number {
  if (!Number.isFinite(homeValue) || homeValue <= 0 || !Number.isFinite(annualInsuranceRatePercent)) return 0;
  return roundToCents((homeValue * (annualInsuranceRatePercent / 100)) / 12);
}

export function calculateMonthlyMaintenance(homeValue: number, annualMaintenanceRatePercent: number): number {
  if (!Number.isFinite(homeValue) || homeValue <= 0 || !Number.isFinite(annualMaintenanceRatePercent)) return 0;
  return roundToCents((homeValue * (annualMaintenanceRatePercent / 100)) / 12);
}

const PMI_RATE_BY_LTV: [number, number][] = [
  [0.8, 0],
  [0.9, 0.0032],
  [0.95, 0.0045],
  [1.0, 0.006],
];

export function ltv(loanAmount: number, homeValue: number): number {
  if (!Number.isFinite(homeValue) || homeValue <= 0) return 1;
  return roundToCents(loanAmount / homeValue);
}

export function calculateMonthlyPMI(loanAmount: number, homeValue: number): number {
  if (loanAmount <= 0 || homeValue <= 0 || !Number.isFinite(loanAmount) || !Number.isFinite(homeValue)) {
    return 0;
  }
  const ltvRatio = loanAmount / homeValue;
  if (ltvRatio <= 0.8) return 0;
  let annualRate = 0;
  for (const [threshold, rate] of PMI_RATE_BY_LTV) {
    if (ltvRatio <= threshold) {
      annualRate = rate;
      break;
    }
    annualRate = rate;
  }
  return roundToCents((loanAmount * annualRate) / 12);
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function amortizationSchedule(
  loanAmount: number,
  annualRatePercent: number,
  termYears: number,
  maxMonths: number | null = null
): AmortizationRow[] {
  if (loanAmount <= 0 || termYears < 1) return [];
  const payment = calculateMonthlyPI(loanAmount, annualRatePercent, termYears);
  const r = annualRatePercent / 100 / 12;
  const totalMonths = termYears * 12;
  const rows: AmortizationRow[] = [];
  let balance = loanAmount;

  for (let month = 1; month <= totalMonths; month++) {
    if (maxMonths != null && month > maxMonths) break;
    const interest = roundToCents(balance * r);
    let principal = roundToCents(payment - interest);
    if (month === totalMonths) {
      principal = roundToCents(balance);
    }
    balance = roundToCents(balance - principal);
    if (balance < 0) balance = 0;
    rows.push({
      month,
      payment: month === totalMonths ? roundToCents(principal + interest) : payment,
      principal,
      interest,
      balance,
    });
    if (balance <= 0) break;
  }
  return rows;
}
