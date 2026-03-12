import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius)] border bg-[var(--color-surface-card)] p-8 shadow-[var(--shadow-card)] ${className}`}
      style={{ borderColor: "var(--color-border)" }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div
      className={`mb-6 border-b pb-4 ${className}`}
      style={{ borderColor: "var(--color-border)" }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <h2
      className={`text-lg font-semibold tracking-tight text-[var(--color-text-primary)] ${className}`}
    >
      {children}
    </h2>
  );
}
