"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import * as api from "@/lib/api";
import { formatCurrency } from "@/domain";
import { parseApiError, validateSearchForm } from "@/lib/validate";

export function RealEstateSearch() {
  const searchParams = useSearchParams();
  const [location, setLocation] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [downPaymentPct, setDownPaymentPct] = useState("20");
  const [interestRate, setInterestRate] = useState("6.5");
  const [recommendedRangeFromCalculator, setRecommendedRangeFromCalculator] = useState<{ minPrice: number; maxPrice: number } | null>(null);

  useEffect(() => {
    const min = searchParams.get("minPrice");
    const max = searchParams.get("maxPrice");
    if (min != null && max != null) {
      const minNum = parseFloat(min);
      const maxNum = parseFloat(max);
      if (Number.isFinite(minNum) && Number.isFinite(maxNum) && minNum > 0 && maxNum >= minNum) {
        setRecommendedRangeFromCalculator({ minPrice: minNum, maxPrice: maxNum });
        setMaxPrice(String(Math.round(maxNum)));
      }
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [results, setResults] = useState<api.ListingWithAffordability[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors(null);

    const maxPriceNum = parseFloat(maxPrice);
    const monthlyNum = parseFloat(monthlyIncome);
    const annualNum = parseFloat(annualIncome);
    const downNum = parseFloat(downPaymentPct);
    const rateNum = parseFloat(interestRate);

    const validation = validateSearchForm({
      location: location.trim(),
      maxPrice: maxPriceNum,
      monthlyIncome: monthlyNum,
      annualIncome: annualNum,
      downPaymentPct: downNum,
      interestRate: rateNum,
    });

    if (validation) {
      setFieldErrors(validation as Record<string, string>);
      setError("Fix the errors below.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.searchRealEstateWithProfile(
        location.trim(),
        maxPriceNum,
        monthlyNum,
        annualNum,
        downNum,
        rateNum
      );

      setResults(response.listings);
      setSearchLocation(response.search_location);
      setHasSearched(true);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  /** Status badge: use design tokens (safe=success, good=wants/primary, stretch=warning, risky=danger). */
  function getStatusStyle(status: string): React.CSSProperties {
    switch (status) {
      case "safe":
        return { color: "var(--color-success)", backgroundColor: "var(--success-bg)" };
      case "good":
        return { color: "var(--color-wants)", backgroundColor: "var(--wants-bg)" };
      case "stretch":
        return { color: "var(--color-warning)", backgroundColor: "var(--warning-bg)" };
      case "risky":
        return { color: "var(--color-danger)", backgroundColor: "var(--danger-bg)" };
      default:
        return { color: "var(--color-text-muted)", backgroundColor: "var(--primary-light)" };
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search by budget</CardTitle>
          <p className="mt-2 text-[15px] text-[var(--color-text-muted)]">
            Enter a location and budget to see homes that fit your affordability profile. Each listing shows an estimated monthly payment and a tag so you can compare at a glance.
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Listings will be tagged <strong className="text-[var(--color-text-primary)]">Safe</strong>, <strong className="text-[var(--color-text-primary)]">Good</strong>, <strong className="text-[var(--color-text-primary)]">Stretch</strong>, or <strong className="text-[var(--color-text-primary)]">Risky</strong> based on your housing-to-income ratio.
          </p>
          {recommendedRangeFromCalculator && (
            <div
              className="mt-4 p-4 rounded-[var(--radius-input)] border text-sm"
              style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--primary-light)" }}
            >
              <p className="font-medium text-[var(--color-text-primary)]">
                Using recommended range from Calculator: {formatCurrency(recommendedRangeFromCalculator.minPrice)} – {formatCurrency(recommendedRangeFromCalculator.maxPrice)}
              </p>
              <p className="mt-0.5 text-[var(--color-text-muted)]">
                Max price is pre-filled; results will show affordability for each listing.
              </p>
            </div>
          )}
        </CardHeader>

        <form onSubmit={handleSearch} className="space-y-6" aria-busy={loading} aria-describedby={error ? "search-form-error" : undefined}>
            <section className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Location
              </h3>
              <Input
                label="City, state, or ZIP"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA or 94102"
                error={fieldErrors?.location}
                aria-required="true"
              />
              <p className="text-sm text-[var(--color-text-muted)]">
                Where to search. Results will show listings in this area.
              </p>
            </section>

            <div role="separator" className="border-t" style={{ borderColor: "var(--color-border)" }} />

            <section className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Budget
              </h3>
              <Input
                label="Max price ($)"
                type="number"
                min={1}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="500000"
                error={fieldErrors?.maxPrice}
                aria-required="true"
              />
              <p className="text-sm text-[var(--color-text-muted)]">
                We’ll only show listings at or below this price.
              </p>
            </section>

            <div role="separator" className="border-t" style={{ borderColor: "var(--color-border)" }} />

            <section className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Income
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Monthly take-home income ($)"
                  type="number"
                  min={1}
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="6500"
                  error={fieldErrors?.monthlyIncome}
                  aria-required="true"
                />
                <Input
                  label="Annual gross income ($)"
                  type="number"
                  min={1}
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder="100000"
                  error={fieldErrors?.annualIncome}
                  aria-required="true"
                />
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Used to estimate affordability. Take-home is after taxes; gross is before. We use both for a more accurate picture.
              </p>
            </section>

            <div role="separator" className="border-t" style={{ borderColor: "var(--color-border)" }} />

            <section className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                Loan assumptions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Down payment %"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(e.target.value)}
                  placeholder="20"
                  error={fieldErrors?.downPaymentPct}
                />
                <Input
                  label="Interest rate %"
                  type="number"
                  min={0}
                  max={30}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="6.5"
                  error={fieldErrors?.interestRate}
                />
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Used to estimate monthly payment and affordability for each listing. Adjust if you expect different terms.
              </p>
            </section>

            {error && (
              <div
                id="search-form-error"
                className="p-4 rounded-[var(--radius-input)] border"
                style={{ backgroundColor: "var(--danger-bg)", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={loading} aria-busy={loading}>
                {loading ? "Searching…" : "Search listings"}
              </Button>
              {!hasSearched && (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Enter a location and budget to see homes that fit your affordability profile.
                </p>
              )}
            </div>
          </form>
      </Card>

      {hasSearched && results.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No listings found</CardTitle>
            <p className="mt-2 text-[15px] text-[var(--color-text-muted)]">
              No homes in <strong className="text-[var(--color-text-primary)]">{searchLocation}</strong> within your max price. Try a higher max price or different location.
            </p>
          </CardHeader>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{results.length} {results.length === 1 ? "listing" : "listings"} in {searchLocation}</CardTitle>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Affordability is based on housing share of income: Safe &lt;25%, Good 25–30%, Stretch 30–35%, Risky &gt;35%.
            </p>
          </CardHeader>

          <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-[var(--radius-input)] border bg-[var(--color-surface-input)]" style={{ borderColor: "var(--color-border)" }} role="group" aria-label="Affordability legend">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">Affordability</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={getStatusStyle("safe")}>Safe</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={getStatusStyle("good")}>Good</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={getStatusStyle("stretch")}>Stretch</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={getStatusStyle("risky")}>Risky</span>
            </div>

            <div className="space-y-4">
              {results.map((item) => (
                <article
                  key={item.listing.property_id}
                  className="rounded-[var(--radius)] p-4 transition-shadow hover:shadow-[var(--shadow-card)] border"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {item.listing.image_url && (
                      <img
                        src={item.listing.image_url}
                        alt={item.listing.address ? `Photo of ${item.listing.address}` : "Listing photo"}
                        className="w-full sm:w-36 sm:h-36 object-cover rounded-[var(--radius-input)] flex-shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-lg text-[var(--color-text-primary)]">
                            {formatCurrency(item.listing.price)}
                          </h4>
                          <p className="text-[var(--color-text-muted)] truncate">{item.listing.address}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {item.listing.city}, {item.listing.state} {item.listing.zip_code}
                          </p>
                        </div>

                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold shrink-0 w-fit"
                          style={getStatusStyle(item.affordability.status)}
                        >
                          {item.affordability.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)] mb-2">
                        {item.listing.bedrooms != null && <span>{item.listing.bedrooms} bed</span>}
                        {item.listing.bathrooms != null && <span>{item.listing.bathrooms} bath</span>}
                        {item.listing.sqft != null && (
                          <span>{item.listing.sqft.toLocaleString()} sq ft</span>
                        )}
                        {item.listing.property_type && <span>{item.listing.property_type}</span>}
                      </div>

                      <div
                        className="mt-3 p-3 rounded-[var(--radius-input)] border"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-input)" }}
                      >
                        <p className="text-sm font-semibold mb-0.5 text-[var(--color-text-primary)]">
                          Est. monthly payment: {formatCurrency(item.affordability.monthly_payment)}
                          <span className="font-normal text-[var(--color-text-muted)] ml-1">
                            ({item.affordability.housing_pct_of_income}% of income)
                          </span>
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {item.affordability.message}
                        </p>
                      </div>

                      {item.listing.listing_url && (
                        <a
                          href={item.listing.listing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-primary)] hover:underline text-sm mt-2 inline-block focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-app)]"
                        >
                          View listing
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
        </Card>
      )}
    </div>
  );
}
