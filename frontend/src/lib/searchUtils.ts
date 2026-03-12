/**
 * Search filters, listing types, and helpers.
 * Affordability uses shared domain logic (domain/listingAffordability.ts).
 * TODO: Replace getListingsForSearch with real API when listing API is connected.
 */

import { computeListingAffordability } from "@/domain/listingAffordability";

export type AffordabilityTier = "safe" | "stretch" | "over_budget";

export interface SearchFilters {
  location: string;
  maxPrice: number;
  minPrice: number;
  beds: number;
  baths: number;
  propertyType: string;
  interestRate: number;
  downPaymentPct: number;
  monthlyNetIncome: number;
  hoaMax: number;
  propertyTaxEstimate: number;
  onlyInSafeRange: boolean;
}

export interface ListingWithAffordability {
  listing: {
    property_id: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    price: number;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    property_type?: string;
    image_url?: string;
    listing_url?: string;
  };
  monthlyPayment: number;
  affordability: AffordabilityTier;
  housingPctOfIncome: number;
  explanation: string;
}

/**
 * Map 50/30/20 result to Search tier and human-readable explanation.
 * Uses same thresholds as risk analysis: ≤28% safe, ≤35% stretch, >35% over.
 */
function toTierAndExplanation(
  housingPct: number,
  isAffordable: boolean,
  message: string,
  remainingNeeds: number
): { tier: AffordabilityTier; explanation: string } {
  if (!Number.isFinite(housingPct) || housingPct <= 0) {
    return {
      tier: "over_budget",
      explanation: "Add your income in filters to see affordability.",
    };
  }
  let tier: AffordabilityTier;
  let explanation: string;
  if (housingPct <= 28 && isAffordable) {
    tier = "safe";
    explanation =
      remainingNeeds >= 500
        ? "Fits your safe range. Housing cost is within recommended limits."
        : "Fits your budget; consider building a larger emergency buffer.";
  } else if (housingPct <= 35 && isAffordable) {
    tier = "stretch";
    explanation =
      "Affordable but leaves a tight buffer. Consider a lower price or larger down payment.";
  } else {
    tier = "over_budget";
    explanation =
      "Likely too expensive based on your current income. Look for lower prices or increase down payment.";
  }
  return { tier, explanation };
}

/**
 * Attach monthly payment and affordability to a listing using shared calculator logic.
 */
export function attachAffordability(
  listing: ListingWithAffordability["listing"],
  filters: SearchFilters
): ListingWithAffordability {
  const result = computeListingAffordability({
    price: listing.price,
    downPaymentPct: filters.downPaymentPct,
    interestRatePct: filters.interestRate,
    termYears: 30,
    propertyTaxPct: filters.propertyTaxEstimate,
    insurancePct: 0.35,
    hoaMonthly: Math.min(filters.hoaMax, 500),
    maintenancePct: 0.5,
    monthlyTakeHomeIncome: filters.monthlyNetIncome,
    otherMonthlyNeeds: 0,
  });

  const { tier, explanation } = toTierAndExplanation(
    result.affordability.housing_pct_of_income,
    result.affordability.is_affordable,
    result.affordability.message,
    result.affordability.remaining_needs_after_housing
  );

  return {
    listing,
    monthlyPayment: result.totalMonthly,
    affordability: tier,
    housingPctOfIncome: result.affordability.housing_pct_of_income,
    explanation,
  };
}

export type SortOption = "price_asc" | "price_desc" | "affordability" | "payment_asc" | "newest";

const tierOrder: Record<AffordabilityTier, number> = { safe: 0, stretch: 1, over_budget: 2 };

export function sortListings(
  items: ListingWithAffordability[],
  sort: SortOption
): ListingWithAffordability[] {
  const arr = [...items];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => a.listing.price - b.listing.price);
    case "price_desc":
      return arr.sort((a, b) => b.listing.price - a.listing.price);
    case "payment_asc":
      return arr.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
    case "affordability":
      return arr.sort(
        (a, b) =>
          tierOrder[a.affordability] - tierOrder[b.affordability] ||
          a.monthlyPayment - b.monthlyPayment
      );
    case "newest":
      return arr;
    default:
      return arr;
  }
}
