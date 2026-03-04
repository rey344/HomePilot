/**
 * Consistent rounding and currency formatting. Used everywhere for display and in calculations.
 */

export function roundToCents(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a number as USD. Returns "—" for non-finite or negative (when negative not allowed).
 */
export function formatCurrency(n: number, allowNegative = false): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  if (!allowNegative && n < 0) return "—";
  return currencyFormatter.format(n);
}
