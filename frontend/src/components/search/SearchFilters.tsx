"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { SearchFilters as SearchFiltersType } from "@/lib/searchUtils";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onChange: (f: SearchFiltersType) => void;
  onSearch: () => void;
  loading: boolean;
}

export function SearchFilters({
  filters,
  onChange,
  onSearch,
  loading,
}: SearchFiltersProps) {
  const update = (key: keyof SearchFiltersType, value: string | number | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="space-y-4"
      >
        <Input
          id="search-location"
          label="Location"
          placeholder="City, state, or ZIP"
          value={filters.location}
          onChange={(e) => update("location", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="search-min-price"
            label="Min price"
            type="number"
            min={0}
            step={10000}
            value={filters.minPrice || ""}
            onChange={(e) => update("minPrice", Number(e.target.value) || 0)}
          />
          <Input
            id="search-max-price"
            label="Max price"
            type="number"
            min={0}
            step={10000}
            value={filters.maxPrice || ""}
            onChange={(e) => update("maxPrice", Number(e.target.value) || 0)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="search-beds"
            label="Beds"
            type="number"
            min={0}
            max={10}
            value={filters.beds || ""}
            onChange={(e) => update("beds", Number(e.target.value) || 0)}
          />
          <Input
            id="search-baths"
            label="Baths"
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={filters.baths || ""}
            onChange={(e) => update("baths", Number(e.target.value) || 0)}
          />
        </div>
        <Input
          id="search-property-type"
          label="Property type"
          placeholder="e.g. Single Family, Condo"
          value={filters.propertyType}
          onChange={(e) => update("propertyType", e.target.value)}
        />
        <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">
            Your budget
          </p>
          <div className="space-y-3">
            <Input
              id="search-rate"
              label="Interest rate %"
              type="number"
              min={0}
              max={20}
              step={0.125}
              value={filters.interestRate || ""}
              onChange={(e) => update("interestRate", Number(e.target.value) || 0)}
            />
            <Input
              id="search-down"
              label="Down payment %"
              type="number"
              min={0}
              max={100}
              step={1}
              value={filters.downPaymentPct || ""}
              onChange={(e) => update("downPaymentPct", Number(e.target.value) || 0)}
            />
            <Input
              id="search-income"
              label="Monthly net income"
              type="number"
              min={0}
              step={100}
              value={filters.monthlyNetIncome || ""}
              onChange={(e) => update("monthlyNetIncome", Number(e.target.value) || 0)}
            />
            <Input
              id="search-hoa"
              label="HOA max / month"
              type="number"
              min={0}
              step={50}
              value={filters.hoaMax || ""}
              onChange={(e) => update("hoaMax", Number(e.target.value) || 0)}
            />
            <Input
              id="search-tax"
              label="Property tax % (est.)"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={filters.propertyTaxEstimate || ""}
              onChange={(e) => update("propertyTaxEstimate", Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyInSafeRange}
            onChange={(e) => update("onlyInSafeRange", e.target.checked)}
            className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-text-secondary)]">
            Show only homes within my safe range
          </span>
        </label>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Searching…" : "Search homes"}
        </Button>
      </form>
    </Card>
  );
}
