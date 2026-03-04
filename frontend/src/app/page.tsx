import ScenarioBuilder from "@/components/ScenarioBuilder";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <div className="bg-blue-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">HomePilot</h1>
          <nav className="flex gap-4">
            <Link href="/" className="hover:underline">
              Calculator
            </Link>
            <Link href="/search-homes" className="hover:underline">
              Search Homes
            </Link>
          </nav>
        </div>
      </div>
      <ScenarioBuilder />
    </div>
  );
}
