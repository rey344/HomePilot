"use client";

import { formatCurrency } from "@/domain/round";
import type { ListingWithAffordability, AffordabilityTier } from "@/lib/searchUtils";

const BADGE_STYLES: Record<AffordabilityTier, { label: string; className: string }> = {
  safe: {
    label: "Safe",
    className: "bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30",
  },
  stretch: {
    label: "Stretch",
    className: "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30",
  },
  over_budget: {
    label: "Over budget",
    className: "bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/30",
  },
};

interface ListingCardProps {
  item: ListingWithAffordability;
}

export function ListingCard({ item }: ListingCardProps) {
  const { listing, monthlyPayment, affordability, explanation } = item;
  const badge = BADGE_STYLES[affordability];
  const imageUrl =
    listing.image_url ||
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=280&fit=crop";

  return (
    <article
      className="rounded-xl border overflow-hidden transition-shadow hover:shadow-lg"
      style={{
        backgroundColor: "var(--color-surface-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="aspect-[4/3] relative bg-[var(--color-surface-input)]">
        <img
          src={imageUrl}
          alt={listing.address}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {formatCurrency(listing.price)}
          </h3>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {listing.address}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {listing.city}, {listing.state} {listing.zip_code}
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
          {listing.bedrooms != null && <span>{listing.bedrooms} bed</span>}
          {listing.bathrooms != null && <span>{listing.bathrooms} bath</span>}
          {listing.sqft != null && (
            <span>{listing.sqft.toLocaleString()} sq ft</span>
          )}
          {listing.property_type && <span>{listing.property_type}</span>}
        </div>
        <div
          className="rounded-[var(--radius-input)] border p-3"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--primary-light)",
          }}
        >
          <p className="text-sm font-medium text-[var(--color-primary)]">
            Est. payment: {formatCurrency(monthlyPayment)}/mo
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {explanation}
          </p>
        </div>
        {listing.listing_url && (
          <a
            href={listing.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            View listing →
          </a>
        )}
      </div>
    </article>
  );
}
