import { SearchHomesView } from "@/components/search/SearchHomesView";

export default function SearchHomesPage() {
  return (
    <main className="min-h-screen py-8" style={{ backgroundColor: "var(--color-bg-app)" }}>
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
            Search homes
          </h1>
          <p className="text-[15px] text-[var(--color-text-muted)] max-w-xl">
            Find listings and see how each home fits your budget. We estimate monthly payment and classify each as Safe, Stretch, or Over budget based on your income and loan assumptions.
          </p>
        </div>

        <SearchHomesView />
      </div>
    </main>
  );
}
