import Link from "next/link";
import { AdvisorChat } from "@/components/AdvisorChat";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Advisor – HomePilot",
  description: "Get advice on your affordability scenario.",
};

export default function AdvisorPage() {
  return (
    <div className="min-h-screen relative z-10">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Advisor
          </h1>
          <p className="mt-1 text-[15px] text-[var(--color-text-muted)]">
            Ask questions about your scenario. Run the{" "}
            <Link
              href="/"
              className="font-medium text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-app)]"
            >
              calculator
            </Link>{" "}
            and click Calculate first for context-aware advice, or ask general questions here.
          </p>
        </div>
        <Card className="max-w-[480px] overflow-hidden p-0">
          <div className="min-h-[360px]">
            <AdvisorChat scenarioContext={null} />
          </div>
        </Card>
      </div>
    </div>
  );
}
