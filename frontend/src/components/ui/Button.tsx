import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center h-11 min-w-[44px] rounded-[var(--radius-input)] px-5 text-sm font-medium transition-all focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-app)] disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    primary:
      "text-white bg-[var(--color-primary)] hover:brightness-110 focus-visible:ring-[var(--color-primary)]",
    secondary:
      "border bg-transparent text-[var(--color-text-primary)] hover:bg-white/5",
    ghost: "text-[var(--color-text-primary)] hover:bg-white/5",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      style={
        variant === "primary"
          ? {
              background: "linear-gradient(90deg, #00C9FF, #00E0FF)",
            }
          : variant === "secondary" || variant === "ghost"
            ? { borderColor: "var(--color-border)" }
            : undefined
      }
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
