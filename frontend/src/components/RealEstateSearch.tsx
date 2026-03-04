"use client";

import { useState } from "react";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import * as api from "@/lib/api";

export function RealEstateSearch() {
  const [location, setLocation] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [downPaymentPct, setDownPaymentPct] = useState("20");
  const [interestRate, setInterestRate] = useState("6.5");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<api.ListingWithAffordability[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location || !monthlyIncome || !annualIncome || !maxPrice) {
      setError("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.searchRealEstateWithProfile(
        location,
        parseFloat(maxPrice),
        parseFloat(monthlyIncome),
        parseFloat(annualIncome),
        parseFloat(downPaymentPct),
        parseFloat(interestRate)
      );
      
      setResults(response.listings);
      setSearchLocation(response.search_location);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search listings");
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "text-green-600 bg-green-50";
      case "good":
        return "text-blue-600 bg-blue-50";
      case "stretch":
        return "text-yellow-600 bg-yellow-50";
      case "risky":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };
  
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Find Homes You Can Afford</h2>
          <p className="text-gray-600 mb-6">
            Search real estate listings and instantly see how they fit your budget.
          </p>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Location (City, State, or ZIP) *"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA or 94102"
                required
              />
              
              <Input
                label="Max Price *"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="500000"
                required
              />
              
              <Input
                label="Monthly Take-Home Income *"
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="6500"
                required
              />
              
              <Input
                label="Annual Gross Income *"
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                placeholder="100000"
                required
              />
              
              <Input
                label="Down Payment %"
                type="number"
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(e.target.value)}
                placeholder="20"
                step="0.1"
              />
              
              <Input
                label="Interest Rate %"
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="6.5"
                step="0.1"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded">
                {error}
              </div>
            )}
            
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search Listings"}
            </Button>
          </form>
        </div>
      </Card>
      
      {results.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">
              {results.length} Listings in {searchLocation}
            </h3>
            
            <div className="space-y-4">
              {results.map((item) => (
                <div
                  key={item.listing.property_id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {item.listing.image_url && (
                      <img
                        src={item.listing.image_url}
                        alt={item.listing.address}
                        className="w-32 h-32 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-lg">
                            {formatCurrency(item.listing.price)}
                          </h4>
                          <p className="text-gray-600">{item.listing.address}</p>
                          <p className="text-sm text-gray-500">
                            {item.listing.city}, {item.listing.state} {item.listing.zip_code}
                          </p>
                        </div>
                        
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            item.affordability.status
                          )}`}
                        >
                          {item.affordability.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex gap-4 text-sm text-gray-600 mb-2">
                        {item.listing.bedrooms && (
                          <span>{item.listing.bedrooms} bed</span>
                        )}
                        {item.listing.bathrooms && (
                          <span>{item.listing.bathrooms} bath</span>
                        )}
                        {item.listing.sqft && (
                          <span>{item.listing.sqft.toLocaleString()} sq ft</span>
                        )}
                        {item.listing.property_type && (
                          <span>{item.listing.property_type}</span>
                        )}
                      </div>
                      
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-semibold mb-1">
                          Monthly Payment: {formatCurrency(item.affordability.monthly_payment)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.affordability.message}
                        </p>
                      </div>
                      
                      {item.listing.listing_url && (
                        <a
                          href={item.listing.listing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                        >
                          View Full Listing →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
