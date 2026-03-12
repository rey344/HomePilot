import { RealEstateSearch } from "@/components/RealEstateSearch";

export default function SearchHomesPage() {
  return (
    <main className="min-h-screen py-8" style={{ backgroundColor: "var(--color-surface)" }}>
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
            Search Homes
          </h1>
          <p className="text-[15px] text-[var(--color-text-muted)]">
            Search for homes and see instant affordability analysis (Safe, Stretch, Over budget) based on your budget.
          </p>
        </div>

        <RealEstateSearch />
      </div>
    </main>
  );
}
