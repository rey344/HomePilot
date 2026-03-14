/**
 * Coerce API or form values to numbers. Used for API responses and chart data.
 */

/** Coerce unknown to number; finite number or parseable string, else 0. */
export function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}
