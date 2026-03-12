/**
 * Mock listing data for Search Homes.
 * TODO: Replace getListingsForSearch with real API (e.g. api.searchRealEstate or dedicated endpoint).
 */

import type { ListingWithAffordability } from "./searchUtils";
import type { SearchFilters } from "./searchUtils";

export type RawListing = ListingWithAffordability["listing"];

const MOCK_LISTINGS: RawListing[] = [
  {
    property_id: "mock-1",
    address: "124 Oak Street",
    city: "Austin",
    state: "TX",
    zip_code: "78701",
    price: 385000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1850,
    property_type: "Single Family",
    image_url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=280&fit=crop",
    listing_url: "#",
  },
  {
    property_id: "mock-2",
    address: "456 Maple Ave",
    city: "Austin",
    state: "TX",
    zip_code: "78702",
    price: 475000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2200,
    property_type: "Single Family",
    image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=280&fit=crop",
    listing_url: "#",
  },
  {
    property_id: "mock-3",
    address: "789 Pine Rd",
    city: "Austin",
    state: "TX",
    zip_code: "78703",
    price: 299000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    property_type: "Condo",
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=280&fit=crop",
    listing_url: "#",
  },
  {
    property_id: "mock-4",
    address: "321 Cedar Lane",
    city: "Austin",
    state: "TX",
    zip_code: "78704",
    price: 549000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2600,
    property_type: "Single Family",
    image_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=280&fit=crop",
    listing_url: "#",
  },
  {
    property_id: "mock-5",
    address: "555 Elm St",
    city: "Austin",
    state: "TX",
    zip_code: "78705",
    price: 419000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1950,
    property_type: "Townhouse",
    image_url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=280&fit=crop",
    listing_url: "#",
  },
];

function getMockListings(): RawListing[] {
  return MOCK_LISTINGS.map((l) => ({ ...l }));
}

/**
 * Data layer: fetch listings for the given filters.
 * Mock: returns static list after a short delay. Replace with real API call when integrated.
 */
export async function getListingsForSearch(_filters: SearchFilters): Promise<RawListing[]> {
  await new Promise((r) => setTimeout(r, 500));
  return getMockListings();
}
