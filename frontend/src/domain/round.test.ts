import { describe, expect, it } from "vitest";
import { roundToCents, formatCurrency } from "./round";

describe("roundToCents", () => {
  it("rounds to two decimals", () => {
    expect(roundToCents(1.234)).toBe(1.23);
    expect(roundToCents(1.236)).toBe(1.24);
  });
  it("returns 0 for NaN", () => {
    expect(roundToCents(NaN)).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats positive number as USD", () => {
    expect(formatCurrency(1234.56)).toMatch(/\$1,235/);
  });
  it("returns — for NaN", () => {
    expect(formatCurrency(NaN)).toBe("—");
  });
  it("returns — for negative when allowNegative false", () => {
    expect(formatCurrency(-1)).toBe("—");
  });
});
