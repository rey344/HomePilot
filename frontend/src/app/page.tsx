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
              Home Affordability
            </h2>
            <p className="text-[15px] text-[var(--color-text-muted)] mb-3">
              Use the <strong className="text-[var(--color-text-primary)]">Calculator</strong> for monthly costs and 50/30/20 analysis, then explore price recommendations, <strong className="text-[var(--color-text-primary)]">Advisor</strong> chat, or <strong className="text-[var(--color-text-primary)]">Search Homes</strong>.
            </p>
            <p className="text-[15px] text-[var(--color-text-muted)] mb-4">
              Enter your numbers below and click Calculate to see results.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-[var(--color-text-muted)]" style={{ backgroundColor: "var(--primary-light)" }}>
                Price recommendations
              </span>
              <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-[var(--color-text-muted)]" style={{ backgroundColor: "var(--primary-light)" }}>
                Risk analysis
              </span>
              <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-[var(--color-text-muted)]" style={{ backgroundColor: "var(--primary-light)" }}>
                5-year projections
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
