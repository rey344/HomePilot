import { Suspense } from "react";
import Link from "next/link";
import { RealEstateSearch } from "@/components/RealEstateSearch";

export const metadata = {
  title: "Search Homes – HomePilot",
  description: "Search listings with affordability badges.",
};

function SearchFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 rounded-[var(--radius)] border bg-[var(--color-surface-card)]" style={{ borderColor: "var(--color-border)" }} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen relative z-10">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Search Homes
          </h1>
          <p className="mt-2 text-[15px] text-[var(--color-text-muted)]">
            Search by location and budget; each listing shows an affordability badge. For a recommended price range, use the{" "}
            <Link
              href="/"
              className="font-medium text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-app)]"
            >
              Calculator
            </Link>{" "}
            first.
          </p>
        </div>
        <Suspense fallback={<SearchFallback />}>
          <RealEstateSearch />
        </Suspense>
      </div>
    </div>
  );
}
