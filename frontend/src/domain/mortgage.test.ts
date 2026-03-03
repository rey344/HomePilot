import { describe, expect, it } from "vitest";
import {
  calculateLoanAmount,
  calculateMonthlyPI,
  calculateMonthlyPropertyTax,
  calculateMonthlyPMI,
  amortizationSchedule,
} from "./mortgage";

describe("calculateLoanAmount", () => {
  it("returns home value minus down payment", () => {
    expect(calculateLoanAmount(300000, 60000)).toBe(240000);
  });
  it("returns 0 when home value is 0", () => {
    expect(calculateLoanAmount(0, 0)).toBe(0);
  });
});

describe("calculateMonthlyPI", () => {
  it("returns positive payment for standard inputs", () => {
    const pi = calculateMonthlyPI(240000, 6.5, 30);
    expect(pi).toBeGreaterThan(1500);
    expect(pi).toBeLessThan(1600);
  });
  it("returns 0 when loan amount is 0", () => {
    expect(calculateMonthlyPI(0, 6, 30)).toBe(0);
  });
});

describe("calculateMonthlyPropertyTax", () => {
  it("returns monthly tax from annual percent", () => {
    const tax = calculateMonthlyPropertyTax(300000, 1.2);
    expect(tax).toBe(300);
  });
});

describe("PMI", () => {
  it("LTV <= 80% has no PMI", () => {
    expect(calculateMonthlyPMI(200000, 250000)).toBe(0);
  });
  it("LTV > 80% has PMI", () => {
    const pmi = calculateMonthlyPMI(250000, 300000);
    expect(pmi).toBeGreaterThan(0);
  });
});

describe("amortizationSchedule", () => {
  it("returns 60 rows when maxMonths=60", () => {
    const rows = amortizationSchedule(240000, 6.5, 30, 60);
    expect(rows).toHaveLength(60);
  });
});
