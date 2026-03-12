"use client";

import { useState, useMemo } from "react";
import { SearchFilters } from "./SearchFilters";
import { ListingCard } from "./ListingCard";
import { Card } from "@/components/ui/Card";
import { getListingsForSearch } from "@/lib/searchMock";
import {
  type SearchFilters as SearchFiltersType,
  type ListingWithAffordability,
  attachAffordability,
  sortListings,
  type SortOption,
} from "@/lib/searchUtils";

const DEFAULT_FILTERS: SearchFiltersType = {
  location: "",
  maxPrice: 600000,
  minPrice: 0,
  beds: 0,
  baths: 0,
  propertyType: "",
  interestRate: 6.5,
  downPaymentPct: 20,
  monthlyNetIncome: 6500,
  hoaMax: 0,
  propertyTaxEstimate: 1.2,
  onlyInSafeRange: false,
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "affordability", label: "Affordability" },
  { value: "price_asc", label: "Price (low to high)" },
  { value: "price_desc", label: "Price (high to low)" },
  { value: "payment_asc", label: "Monthly payment" },
  { value: "newest", label: "Newest" },
];

export function SearchHomesView() {
  const [filters, setFilters] = useState<SearchFiltersType>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sort, setSort] = useState<SortOption>("affordability");
  const [results, setResults] = useState<ListingWithAffordability[]>([]);
  const [searchLocation, setSearchLocation] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const raw = await getListingsForSearch(filters);
      const withAffordability = raw.map((listing) =>
        attachAffordability(listing, filters)
      );
      let filtered = withAffordability;
      if (filters.minPrice > 0) {
        filtered = filtered.filter((l) => l.listing.price >= filters.minPrice);
      }
      if (filters.maxPrice > 0) {
        filtered = filtered.filter((l) => l.listing.price <= filters.maxPrice);
      }
      if (filters.beds > 0) {
        filtered = filtered.filter(
          (l) => (l.listing.bedrooms ?? 0) >= filters.beds
        );
      }
      if (filters.baths > 0) {
        filtered = filtered.filter(
          (l) => (l.listing.bathrooms ?? 0) >= filters.baths
        );
      }
      if (filters.onlyInSafeRange) {
        filtered = filtered.filter((l) => l.affordability === "safe");
      }
      setResults(sortListings(filtered, sort));
      setSearchLocation(filters.location || "your area");
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = useMemo(
    () => sortListings(results, sort),
    [results, sort]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: filters */}
      <aside className="lg:w-80 shrink-0">
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          onSearch={handleSearch}
          loading={loading}
        />
      </aside>

      {/* Right: results */}
      <div className="flex-1 min-w-0">
        {!searched ? (
          <Card className="border-dashed">
            <p className="text-[var(--color-text-muted)] mb-2 text-center">
              Set your filters and click &quot;Search homes&quot; to see listings with affordability insights.
            </p>
            <p className="text-sm text-[var(--color-text-muted)] text-center">
              Each result uses the same 50/30/20 logic as the calculator: estimated monthly payment (P&I, tax, insurance, PMI, HOA, maintenance) and a Safe / Stretch / Over budget label.
            </p>
          </Card>
        ) : loading ? (
          <Card>
            <p className="text-[var(--color-text-muted)] text-center py-8">Loading listings…</p>
          </Card>
        ) : sortedResults.length === 0 ? (
          <Card>
            <p className="text-[var(--color-text-primary)] font-medium mb-1 text-center">
              No listings match your filters
            </p>
            <p className="text-sm text-[var(--color-text-muted)] text-center">
              Try widening price range or turning off &quot;Show only homes within my safe range&quot;.
            </p>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {sortedResults.length} homes in {searchLocation || "your area"}
              </h2>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="search-sort"
                  className="text-sm text-[var(--color-text-muted)]"
                >
                  Sort by
                </label>
                <select
                  id="search-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="rounded-lg border bg-[var(--color-surface-input)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {sortedResults.map((item) => (
                <ListingCard key={item.listing.property_id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
