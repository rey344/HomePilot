"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [{ href: "/", label: "Calculator" }] as const;

function HomePilotLogo() {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
      aria-hidden="true"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M3 10.5L12 3L21 10.5"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.75 9.75V20H17.25V9.75"
          stroke="var(--color-text-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 20V14H14V20"
          stroke="var(--color-text-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-20 border-b backdrop-blur-sm"
      style={{
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        borderColor: "var(--color-border)",
      }}
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-md text-[var(--color-text-primary)] no-underline transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[#111827]"
            aria-label="HomePilot home"
          >
            <HomePilotLogo />
            <div className="flex flex-col leading-none">
              <span className="text-[1rem] font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-[1.05rem]">
                HomePilot
              </span>
              <span className="hidden text-xs text-[var(--color-text-muted)] sm:block">
                Homebuying Planner
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-5 sm:gap-6">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[rgba(17,24,39,0.9)] ${
                    isActive
                      ? "text-[var(--color-primary)] underline underline-offset-4"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
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