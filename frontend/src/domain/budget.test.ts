import { describe, expect, it } from "vitest";
import { calculateAffordability } from "./budget";

describe("calculateAffordability", () => {
  it("income drives needs budget; different income → different budget", () => {
    const a = calculateAffordability(6000, 2000, 500);
    const b = calculateAffordability(4000, 2000, 500);
    expect(a.needs_budget_50).toBe(3000);
    expect(b.needs_budget_50).toBe(2000);
    expect(a.is_affordable).toBe(true);
    expect(b.is_affordable).toBe(false);
  });
  it("housing + other_needs <= 50% is affordable", () => {
    const r = calculateAffordability(6000, 2000, 1000);
    expect(r.needs_budget_50).toBe(3000);
    expect(r.remaining_needs_after_housing).toBe(0);
    expect(r.is_affordable).toBe(true);
  });
  it("income <= 0 returns safe message and no division", () => {
    const r = calculateAffordability(0, 2000, 0);
    expect(r.message).toContain("positive");
    expect(r.housing_pct_of_income).toBe(0);
    expect(r.is_affordable).toBe(false);
  });
});
