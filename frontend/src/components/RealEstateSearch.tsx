"use client";

import { useState } from "react";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import * as api from "@/lib/api";
import { formatCurrency } from "@/domain";
import { parseApiError, validateSearchForm } from "@/lib/validate";

export function RealEstateSearch() {
  const [location, setLocation] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [downPaymentPct, setDownPaymentPct] = useState("20");
  const [interestRate, setInterestRate] = useState("6.5");

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
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-[var(--color-text-primary)]">
            Search by budget
          </h2>
          <p className="text-[var(--color-text-muted)] mb-2">
            Listings are tagged by affordability (50/30/20) so you can see how each fits your budget.
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Enter location, max price, and income to see estimated monthly payment and badge per listing.
          </p>

          <form onSubmit={handleSearch} className="space-y-4" aria-busy={loading} aria-describedby={error ? "search-form-error" : undefined}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Location (city, state, or ZIP)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA or 94102"
                error={fieldErrors?.location}
                aria-required="true"
              />

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

            {error && (
              <div
                id="search-form-error"
                className="p-3 rounded-lg border"
                style={{ backgroundColor: "var(--danger-bg)", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
                role="alert"
              >
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} aria-busy={loading}>
              {loading ? "Searching…" : "Search listings"}
            </Button>
          </form>
        </div>
      </Card>

      {hasSearched && results.length === 0 && (
        <Card>
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              No listings found
            </h3>
            <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
              No homes in <strong className="text-[var(--color-text-primary)]">{searchLocation}</strong> within your max price. Try a higher max price or different location.
            </p>
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-[var(--color-text-primary)]">
              {results.length} {results.length === 1 ? "listing" : "listings"} in {searchLocation}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Affordability is based on housing share of income: Safe &lt;25%, Good 25–30%, Stretch 30–35%, Risky &gt;35%.
            </p>

            <div className="flex flex-wrap gap-3 mb-4 p-3 rounded-[var(--radius-input)] border bg-[var(--color-surface-input)]" style={{ borderColor: "var(--color-border)" }} role="group" aria-label="Affordability legend">
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
                  className="rounded-lg p-4 transition-shadow hover:shadow-[var(--shadow-card)] border"
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
                          className="text-[var(--color-primary)] hover:underline text-sm mt-2 inline-block focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-card)]"
                        >
                          View listing
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
