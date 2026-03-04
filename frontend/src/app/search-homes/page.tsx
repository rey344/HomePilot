import { RealEstateSearch } from "@/components/RealEstateSearch";
import Link from "next/link";

export default function SearchHomesPage() {
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
      
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Real Estate Search</h1>
            <p className="text-gray-600">
              Search for homes and see instant affordability analysis based on your budget.
            </p>
          </div>
          
          <RealEstateSearch />
        </div>
      </main>
    </div>
  );
}
