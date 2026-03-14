import { AdvisorPageContent } from "@/components/AdvisorPageContent";

export const metadata = {
  title: "Advisor – HomePilot",
  description: "Get advice on your affordability scenario.",
};

export default function AdvisorPage() {
  return (
    <div className="min-h-screen relative z-10">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AdvisorPageContent />
      </div>
    </div>
  );
}
