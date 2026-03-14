"use client";

import { useEffect, type CSSProperties } from "react";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styleByType: Record<string, CSSProperties> = {
    success: { backgroundColor: "var(--color-success)", color: "var(--color-primary-fg)" },
    error: { backgroundColor: "var(--color-danger)", color: "var(--color-primary-fg)" },
    info: { backgroundColor: "var(--color-wants)", color: "var(--color-primary-fg)" },
  };
  const style = styleByType[type] ?? styleByType.info;

  return (
    <div
      className="fixed bottom-4 right-4 px-6 py-3 rounded-[var(--radius-input)] shadow-[var(--shadow-card)] flex items-center gap-3 z-50 animate-slide-up border"
      style={{ ...style, borderColor: "var(--color-border)" }}
      role="alert"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 opacity-90 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-transparent rounded"
        style={{ color: "inherit" }}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: "success" | "error" | "info" }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </>
  );
}
