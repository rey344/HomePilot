import { type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  id?: string;
  error?: string;
  className?: string;
}

export function Input({ label, id, error, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name ?? `input-${Math.random().toString(36).slice(2)}`;
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-[var(--color-text-muted)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`h-11 w-full rounded-[var(--radius-input)] border bg-[var(--color-surface-input)] px-4 py-2.5 text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-[border-color,box-shadow] duration-150 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 ${
          error
            ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20"
            : ""
        } ${className}`}
        style={
          !error
            ? { borderColor: "var(--color-border)" }
            : undefined
        }
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
