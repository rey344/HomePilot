"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Calculator" },
  { href: "/search-homes", label: "Search Homes" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b backdrop-blur-sm sticky top-0 z-20"
      style={{
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        borderColor: "var(--color-border)",
      }}
      aria-label="Main navigation"
    >
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-[var(--color-text-primary)] no-underline hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[#111827] rounded-md"
            aria-label="HomePilot home"
          >
            <span
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-white font-bold text-[1.1rem] leading-none"
              style={{ backgroundColor: "var(--color-primary)" }}
              aria-hidden
            >
              H
            </span>
            <span className="text-[1.125rem] font-semibold tracking-tight text-[var(--color-text-primary)]">
              HomePilot
            </span>
          </Link>
          <div className="flex gap-6">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[rgba(17,24,39,0.9)] rounded ${
                    isActive
                      ? "text-[var(--color-primary)] underline underline-offset-4"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={isActive ? `${label} (current page)` : label}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
