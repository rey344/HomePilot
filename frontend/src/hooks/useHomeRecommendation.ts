"use client";

import { useState, useEffect } from "react";
import { fetchHomeRecommendation, type HomeRecommendationResponse } from "@/lib/api";

/** Take-home to gross: we use gross = takeHome / 0.77 (≈23% effective tax). */
const GROSS_FROM_TAKEHOME = 1 / 0.77;

/**
 * Fetches recommended home price range when monthly take-home income is set.
 * Used by the calculator to show the "Recommended price range" card.
 */
export function useHomeRecommendation(monthlyTakeHomeIncomeInput: string) {
  const [homeRecommendation, setHomeRecommendation] = useState<HomeRecommendationResponse | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  useEffect(() => {
    const income = parseFloat(monthlyTakeHomeIncomeInput);
    if (income > 0) {
      setLoadingRecommendation(true);
      const grossIncome = income * GROSS_FROM_TAKEHOME;
      fetchHomeRecommendation({ monthly_gross_income: grossIncome })
        .then(setHomeRecommendation)
        .catch((err) => {
          console.error("Failed to fetch home recommendation:", err);
        })
        .finally(() => {
          setLoadingRecommendation(false);
        });
    } else {
      setHomeRecommendation(null);
    }
  }, [monthlyTakeHomeIncomeInput]);

  return { homeRecommendation, loadingRecommendation };
}

export { GROSS_FROM_TAKEHOME };
