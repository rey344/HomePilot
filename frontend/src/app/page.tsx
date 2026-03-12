import ScenarioBuilder from "@/components/ScenarioBuilder";

export default function Home() {
  return (
    <div className="min-h-screen relative z-10">
      {/* Hero Section */}
      <div
        className="border-b"
        style={{
          background: "linear-gradient(135deg, rgba(0, 201, 255, 0.12) 0%, rgba(0, 153, 204, 0.06) 100%)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3">
              AI-Powered Home Affordability
            </h2>
            <p className="text-[15px] text-[var(--color-text-muted)] mb-4">
              True cost of homeownership · 50/30/20 affordability · Run the calculator to see smart recommendations, risk analysis, and 5-year projections.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)]" style={{ backgroundColor: "var(--primary-light)" }}>
                <span className="text-[var(--color-success)]">✓</span> Smart Recommendations
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)]" style={{ backgroundColor: "var(--primary-light)" }}>
                <span className="text-[var(--color-success)]">✓</span> Risk Analysis
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)]" style={{ backgroundColor: "var(--primary-light)" }}>
                <span className="text-[var(--color-success)]">✓</span> 5-Year Projections
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScenarioBuilder />
      </div>
    </div>
  );
}
